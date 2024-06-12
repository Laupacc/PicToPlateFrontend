import Ionicons from "@expo/vector-icons/Ionicons";
import { type IconProps } from "@expo/vector-icons/build/createIconSet";
import { type ComponentProps } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function TabBarIcon({
  iconSet = "Ionicons", // default to Ionicons
  ...rest
}: IconProps<ComponentProps<typeof Ionicons>["name"]> & {
  iconSet?: "Ionicons" | "MaterialCommunityIcons";
}) {
  const IconComponent =
    iconSet === "Ionicons" ? Ionicons : MaterialCommunityIcons;
  return <IconComponent size={28} {...rest} />;
}
