import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { FeedMatchCard } from '@/components/session/FeedMatchCard';
import { SessionMetaCard } from '@/components/session/SessionMetaCard';

const mockIcon = () => {
  const React = require('react');
  return React.createElement('View');
};

describe('UI Snapshots', () => {
  test('FeedMatchCard renders correctly', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <FeedMatchCard
          courtName="Sân Pickleball Chu Văn An"
          address="Số 10 Chu Văn An, Hà Nội"
          timeLabel="08:00 - 10:00"
          dateLabel="Thứ 7, 24/05"
          bookingStatus="confirmed"
          skillLabel="Trung bình"
          skillIcon={mockIcon}
          skillTagClassName=""
          skillTextClassName=""
          skillBorderClassName=""
          skillIconColor="#000"
          eloValue={1200}
          duprValue="3.5"
          matchTypeLabel="Đánh đôi"
          hostName="Quốc Khánh"
          priceLabel="50K"
          availabilityLabel="3/4"
          onPress={() => {}}
        />
      );
    });
    expect(tree.toJSON()).toMatchSnapshot();
  });

  test('SessionMetaCard renders correctly', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <SessionMetaCard
          skillLevelId="level_3"
          sessionSkillLabel="Intermediate"
          courtName="Sân Chu Văn An"
          courtAddress="Số 10 Chu Văn An"
          courtCity="Hà Nội"
          timeLabel="Thứ 7, 24/05 • 08:00"
          priceLabel="50K"
          maxPlayers={4}
          hostNote="Vui vẻ hòa đồng, không toxic."
        />
      );
    });
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
