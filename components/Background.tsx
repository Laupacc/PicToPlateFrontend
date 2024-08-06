import React from "react";
import { View, Dimensions } from "react-native";
import Svg, { Line } from "react-native-svg";

export default function Background({ cellSize }) {
  const { width, height } = Dimensions.get("screen");
  const numberOfVerticalLines = Math.ceil(width / cellSize);
  const numberOfHorizontalLines = Math.ceil(height / cellSize);

  return (
    <View style={{ position: "absolute", width, height }}>
      <Svg height={height} width={width}>
        {Array.from({ length: numberOfVerticalLines }).map((_, index) => (
          <Line
            key={`v-${index}`}
            x1={index * cellSize}
            y1="0"
            x2={index * cellSize}
            y2="100%"
            stroke="rgba(0, 0, 0, 0.08)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: numberOfHorizontalLines }).map((_, index) => (
          <Line
            key={`h-${index}`}
            x1="0"
            y1={index * cellSize}
            x2="100%"
            y2={index * cellSize}
            stroke="rgba(0, 0, 0, 0.08)"
            strokeWidth="1"
          />
        ))}
      </Svg>
    </View>
  );
}
