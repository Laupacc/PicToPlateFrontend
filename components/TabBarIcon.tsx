import Ionicons from "@expo/vector-icons/Ionicons";
import { type IconProps } from "@expo/vector-icons/build/createIconSet";
import { type ComponentProps } from "react";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AntDesign from "react-native-vector-icons/AntDesign";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export function TabBarIcon({
  iconSet,
  ...rest
}: {
  iconSet: string;
  [key: string]: any;
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
      IconComponent = FontAwesome;
      break;
    case "AntDesign":
      IconComponent = AntDesign;
      break;
    default:
      IconComponent = Ionicons; // Default to Ionicons
  }
  return <IconComponent size={28} {...rest} />;
}
