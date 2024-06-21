import React from "react";
import { ScrollView, SafeAreaView } from "react-native";
import Svg, { Path } from "react-native-svg";

export default function Postit() {
  return (
    <SafeAreaView>
      <ScrollView>
        <Svg
          fill="#000000"
          height="20" // Set to desired height
          width="20" // Set to desired width
          id="Capa_1"
          viewBox="0 0 198.439 198.439"
          style={{ maxWidth: "100%", maxHeight: "100%" }} // Add this line
        >
          <Path
            d="M197.762,169.999L177.324,5.262c-0.408-3.288-3.398-5.625-6.693-5.215L5.893,20.484c-3.005,0.373-5.261,2.927-5.261,5.955
		v166c0,3.314,2.686,6,6,6h166c3.313,0,6-2.686,6-6v-14.021l13.915-1.727c1.579-0.196,3.016-1.011,3.994-2.266
		C197.518,173.17,197.958,171.578,197.762,169.999z M20.436,186.439h-7.805V123.53L20.436,186.439z M13.882,40.181
		c-0.186,0.023-0.367,0.057-0.546,0.096l-1.183-9.536l154.915-19.22l1.18,9.509L13.882,40.181z M166.632,186.439h-52.65l52.65-6.532
		V186.439z M31.372,185.656L14.805,52.124c0.184-0.006,0.368-0.011,0.554-0.034l154.365-19.151l16.563,133.497L31.372,185.656z"
          />
        </Svg>
      </ScrollView>
    </SafeAreaView>
  );
}
