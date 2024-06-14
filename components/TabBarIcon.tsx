import Ionicons from "@expo/vector-icons/Ionicons";
import { type IconProps } from "@expo/vector-icons/build/createIconSet";
import { type ComponentProps } from "react";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AntDesign from "react-native-vector-icons/AntDesign";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export function TabBarIcon({
  iconSet = "Ionicons", // default to Ionicons
  ...rest
}: IconProps<ComponentProps<typeof Ionicons>["name"]> & {
  iconSet?: "Ionicons" | "MaterialCommunityIcons" | "FontAwesome" | "AntDesign";
}) {
  let IconComponent;
  switch (iconSet) {
    case "Ionicons":
      IconComponent = Ionicons;
      break;
    case "MaterialCommunityIcons":
      IconComponent = MaterialCommunityIcons;
      break;
    case "FontAwesome":
      IconComponent = FontAwesome; // Use FaUserSecret for "FaIcons"
      break;
    case "AntDesign":
      IconComponent = AntDesign;
      break;
    default:
      IconComponent = Ionicons; // Default to Ionicons
  }
  return <IconComponent size={28} {...rest} />;
}
