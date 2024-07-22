import React, { useEffect, useRef } from "react";
import { Animated, Image, View } from "react-native";

const BouncingImage = ({ children }) => {
  // Step 2: Initialize an animated value
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Step 3: Create a bouncing animation
  useEffect(() => {
    const bounceAnimation = () => {
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
      ]).start(() => {
        setTimeout(bounceAnimation, 12000);
      });
    };

    // Start the first animation
    bounceAnimation();

    // Clear the timeout when the component unmounts
    return () => clearTimeout(bounceAnimation);
  }, [bounceAnim]);

  return (
    <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
      {children}
    </Animated.View>
  );
};

export default BouncingImage;
