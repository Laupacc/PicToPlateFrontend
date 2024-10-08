// Step 1: Import necessary components
import React from "react";
import { Text, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  text: {
    fontFamily: "Nobile",
  },
});

const AppText = ({
  children,
  style,
  ...otherProps
}: {
  children: React.ReactNode;
  style: any;
  otherProps: any;
}) => {
  return (
    <Text style={[styles.text, style]} {...otherProps}>
      {children}
    </Text>
  );
};

export default AppText;
