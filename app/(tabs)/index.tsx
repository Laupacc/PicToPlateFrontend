import { Image, StyleSheet, Platform, View, Text } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text className="text-red-700">HomePage</Text>
    </View>
  );
}
