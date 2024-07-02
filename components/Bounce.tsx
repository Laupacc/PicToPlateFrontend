import React, { useEffect, useRef } from 'react';
import { Animated, Image, View } from 'react-native';

const BouncingImage = () => {
  // Step 2: Initialize an animated value
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Step 3: Create a bouncing animation
  const startBouncing = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -30,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: -15,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Step 5: Start the animation
  useEffect(() => {
    startBouncing();
  }, []);

  return (
    <View>
      {/* Step 4: Apply the animation */}
      <Animated.Image
        source={{ uri: 'https://example.com/your-image.png' }}
        style={{
          width: 100,
          height: 100,
          transform: [{ translateY: bounceAnim }],
        }}
      />
    </View>
  );
};

export default BouncingImage;