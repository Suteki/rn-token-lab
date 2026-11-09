import React from 'react';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
export function ProgressRing({
  percent,
  size = 88,
}: {
  percent: number;
  size?: number;
}) {
  const value = Math.max(0, Math.min(100, percent));
  const radius = (size - 12) / 2;
  const perimeter = 2 * Math.PI * radius;
  return (
    <Svg width={size} height={size} accessibilityLabel={`${value}% complete`}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#334155"
        strokeWidth={6}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#a5b4fc"
        strokeWidth={6}
        fill="none"
        strokeDasharray={`${perimeter} ${perimeter}`}
        strokeDashoffset={perimeter * (1 - value / 100)}
        rotation={-90}
        origin={`${size / 2}, ${size / 2}`}
      />
      <SvgText x="50%" y="55%" textAnchor="middle" fill="#f8fafc" fontSize={19}>
        {value}%
      </SvgText>
    </Svg>
  );
}
