import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mzqsxgfvtgmsscbqugni.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cXN4Z2Z2dGdtc3NjYnF1Z25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NjI4NzIsImV4cCI6MjA4OTUzODg3Mn0.U4aLAFVO64PmR4E_1QJh-6mt1wiayj2wrPpKTbDv4j8'
const DUMMY_PASSWORD = process.env.DUMMY_PASSWORD || 'Pickle123!'

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=... npm run smoke:backend')
  process.exit(1)
}

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const IDS = {
  sessions: {
    openConfirmed: '55555555-5555-5555-5555-555555555551',
    resultsPending: '55555555-5555-5555-5555-555555555558',
    pendingCompletion: '55555555-5555-5555-5555-555555555560',
  },
  users: {
    hostConfirmed: {
      email: 'host.confirmed@picklematch.vn',
      id: '90000000-0000-0000-0000-000000000001',
    },
    hostApproval: {
      email: 'host.approval@picklematch.vn',
      id: '90000000-0000-0000-0000-000000000002',
    },
    matchedPlayer: {
      email: 'player.matched@picklematch.vn',
      id: '90000000-0000-0000-0000-000000000003',
    },
    lowerPlayer: {
      email: 'player.lower@picklematch.vn',
      id: '90000000-0000-0000-0000-000000000004',
    },
    socialPlayer: {
      email: 'player.social@picklematch.vn',
      id: '90000000-0000-0000-0000-000000000007',
    },
  },
}

function logStep(message) {
  console.log(`\n== ${message}`)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function runSeed() {
  logStep('Resetting dummy data to a known baseline')
  const result = spawnSync(process.execPath, ['scripts/seed-dummy-data.mjs'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      DUMMY_PASSWORD,
    },
  })

  if (result.status !== 0) {
    throw new Error(`Dummy seed failed with exit code ${result.status ?? 'unknown'}`)
  }
}

async function createUserClient(email) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await client.auth.signInWithPassword({
    email,
    password: DUMMY_PASSWORD,
  })

  if (error) {
    throw new Error(`Sign in failed for ${email}: ${error.message}`)
  }

  return client
}

async function expectRpcError(client, fn, args, expectedSubstring) {
  const { error } = await client.rpc(fn, args)
  assert(error, `Expected ${fn} to fail, but it succeeded`)
  assert(
    error.message.toLowerCase().includes(expectedSubstring.toLowerCase()),
    `Expected ${fn} error to include "${expectedSubstring}", got "${error.message}"`,
  )
}

async function testSaveSessionTeams() {
  logStep('Testing host-only team arrangement')

  const hostClient = await createUserClient(IDS.users.hostConfirmed.email)
  const playerClient = await createUserClient(IDS.users.matchedPlayer.email)
  const assignments = [
    { player_id: IDS.users.hostConfirmed.id, team_no: 1 },
    { player_id: IDS.users.matchedPlayer.id, team_no: 2 },
  ]

  await expectRpcError(playerClient, 'save_session_teams', {
    p_session_id: IDS.sessions.openConfirmed,
    p_assignments: assignments,
  }, 'Not allowed')

  const { error: saveError } = await hostClient.rpc('save_session_teams', {
    p_session_id: IDS.sessions.openConfirmed,
    p_assignments: assignments,
  })

  if (saveError) {
    throw new Error(`Host save_session_teams failed: ${saveError.message}`)
  }

  const { data, error } = await service
    .from('session_players')
    .select('player_id, team_no')
    .eq('session_id', IDS.sessions.openConfirmed)
    .in('player_id', [IDS.users.hostConfirmed.id, IDS.users.matchedPlayer.id])

  if (error) {
    throw new Error(`Failed to verify team assignment: ${error.message}`)
  }

  const teamMap = new Map((data ?? []).map((row) => [row.player_id, row.team_no]))
  assert(teamMap.get(IDS.users.hostConfirmed.id) === 1, 'Host should be assigned to team 1')
  assert(teamMap.get(IDS.users.matchedPlayer.id) === 2, 'Matched player should be assigned to team 2')
}

async function testResultConfirmationAndRating() {
  logStep('Testing result confirmation and secure rating submission')

  const matchedClient = await createUserClient(IDS.users.matchedPlayer.email)

  await expectRpcError(
    matchedClient,
    'submit_rating',
    {
      p_session_id: IDS.sessions.resultsPending,
      p_rated_id: IDS.users.hostApproval.id,
      p_tags: ['friendly'],
      p_no_show: false,
      p_skill_validation: 'matched',
    },
    'finalized',
  )

  const { data: confirmationResult, error: confirmError } = await matchedClient.rpc('respond_to_session_result', {
    p_session_id: IDS.sessions.resultsPending,
    p_response: 'confirmed',
    p_note: null,
  })

  if (confirmError) {
    throw new Error(`respond_to_session_result failed: ${confirmError.message}`)
  }

  assert(confirmationResult === 'finalized', `Expected resultsPending confirmation to finalize, got "${confirmationResult}"`)

  const { data: sessionRow, error: sessionError } = await service
    .from('sessions')
    .select('results_status')
    .eq('id', IDS.sessions.resultsPending)
    .single()

  if (sessionError) {
    throw new Error(`Failed to verify finalized session: ${sessionError.message}`)
  }

  assert(sessionRow?.results_status === 'finalized', 'resultsPending session should be finalized after final confirmation')

  const { error: rateError } = await matchedClient.rpc('submit_rating', {
    p_session_id: IDS.sessions.resultsPending,
    p_rated_id: IDS.users.hostApproval.id,
    p_tags: ['friendly', 'fair_play'],
    p_no_show: false,
    p_skill_validation: 'matched',
  })

  if (rateError) {
    throw new Error(`submit_rating failed after finalization: ${rateError.message}`)
  }

  const { data: ratings, error: ratingsError } = await service
    .from('ratings')
    .select('id, rater_id, rated_id, session_id')
    .eq('session_id', IDS.sessions.resultsPending)
    .eq('rater_id', IDS.users.matchedPlayer.id)
    .eq('rated_id', IDS.users.hostApproval.id)

  if (ratingsError) {
    throw new Error(`Failed to verify rating row: ${ratingsError.message}`)
  }

  assert((ratings ?? []).length === 1, 'Expected exactly one rating row after submit_rating')

  await expectRpcError(
    matchedClient,
    'submit_rating',
    {
      p_session_id: IDS.sessions.resultsPending,
      p_rated_id: IDS.users.hostApproval.id,
      p_tags: ['friendly'],
      p_no_show: false,
      p_skill_validation: 'matched',
    },
    'already rated',
  )
}

async function testHostUnprofessionalReport() {
  logStep('Testing host-unprofessional reporting when host did not submit results')

  const matchedClient = await createUserClient(IDS.users.matchedPlayer.email)
  const lowerClient = await createUserClient(IDS.users.lowerPlayer.email)

  const { data: firstReport, error: firstError } = await matchedClient.rpc('report_host_unprofessional', {
    p_session_id: IDS.sessions.pendingCompletion,
    p_note: 'Host chưa gửi kết quả đúng hạn.',
  })

  if (firstError) {
    throw new Error(`First host-unprofessional report failed: ${firstError.message}`)
  }

  assert(firstReport === 'reported', `Expected first host report to return "reported", got "${firstReport}"`)

  const { data: secondReport, error: secondError } = await lowerClient.rpc('report_host_unprofessional', {
    p_session_id: IDS.sessions.pendingCompletion,
    p_note: 'Host không chốt kết quả, người chơi phải tự theo dõi.',
  })

  if (secondError) {
    throw new Error(`Second host-unprofessional report failed: ${secondError.message}`)
  }

  assert(
    secondReport === 'reported',
    `Expected second host report to return "reported", got "${secondReport}"`,
  )

  const { data: hostRow, error: hostError } = await service
    .from('players')
    .select('host_reputation')
    .eq('id', IDS.users.hostApproval.id)
    .single()

  if (hostError) {
    throw new Error(`Failed to verify host reputation after report: ${hostError.message}`)
  }

  assert(hostRow?.host_reputation === 13, `Expected host reputation to decrease to 13, got "${hostRow?.host_reputation}"`)

  const { data: playerRow, error: playerError } = await service
    .from('session_players')
    .select('host_unprofessional_reported_at, host_unprofessional_report_note')
    .eq('session_id', IDS.sessions.pendingCompletion)
    .eq('player_id', IDS.users.matchedPlayer.id)
    .single()

  if (playerError) {
    throw new Error(`Failed to verify player host report marker: ${playerError.message}`)
  }

  assert(Boolean(playerRow?.host_unprofessional_reported_at), 'Expected host_unprofessional_reported_at to be set')

  const { data: repeatReport, error: repeatError } = await matchedClient.rpc('report_host_unprofessional', {
    p_session_id: IDS.sessions.pendingCompletion,
    p_note: 'Báo lại lần nữa.',
  })

  if (repeatError) {
    throw new Error(`Repeat host-unprofessional report failed unexpectedly: ${repeatError.message}`)
  }

  assert(repeatReport === 'already_reported', `Expected repeat host report to return "already_reported", got "${repeatReport}"`)
}

async function testPendingRatingsProcessor() {
  logStep('Testing pending ratings processor executes without crashing')
  const { data, error } = await service.rpc('process_pending_ratings')

  if (error) {
    throw new Error(`process_pending_ratings failed: ${error.message}`)
  }

  assert(typeof data === 'number', `Expected process_pending_ratings to return a number, got "${typeof data}"`)
  console.log(`process_pending_ratings returned ${data}`)
}

async function main() {
  runSeed()
  await testSaveSessionTeams()
  await testResultConfirmationAndRating()
  await testHostUnprofessionalReport()
  await testPendingRatingsProcessor()
  console.log('\nBackend smoke test passed.\n')
}

main().catch((error) => {
  console.error('\nBackend smoke test failed:')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
