import { ReactNode } from "react";
import { Center } from "@chakra-ui/react";

export const ItemBox = ({
  children,
  bgColor,
}: {
  children: ReactNode;
  bgColor?: string;
}) => {
  return (
    <Center
      height="120px"
      width="120px"
      bgColor={bgColor || "containerBg"}
      borderRadius="10px"
    >
      {children}
    </Center>
  );
};

// export const ItemBox = ({
//   children,
//   bgColor,
// }: {
//   children: ReactNode
//   bgColor?: string
// }) => {
//   return (
//     <Center
//       height="120px"
//       width="120px"
//       bgColor={bgColor || "containerBg"}
//       borderRadius="10px"
//     >
//       {children}
//     </Center>
//   )
// }
