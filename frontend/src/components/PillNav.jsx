import { Box, HStack, Image, Text } from '@chakra-ui/react';
import { useState } from 'react';

const PillNav = ({ 
  logo, 
  logoAlt = "Logo",
  items = [], 
  activeHref = "", 
  className = "",
  ease = "ease-out",
  baseColor = "#000000",
  pillColor = "#ffffff",
  hoveredPillTextColor = "#ffffff",
  pillTextColor = "#000000"
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Convert ease string to CSS transition timing function
  const getEaseFunction = (easeStr) => {
    const easeMap = {
      'power2.easeOut': 'cubic-bezier(0.16, 1, 0.3, 1)',
      'power2.easeIn': 'cubic-bezier(0.7, 0, 0.84, 0)',
      'power2.easeInOut': 'cubic-bezier(0.83, 0, 0.17, 1)',
      'ease-out': 'ease-out',
      'ease-in': 'ease-in',
      'ease-in-out': 'ease-in-out'
    };
    return easeMap[easeStr] || easeStr;
  };

  const transitionTiming = getEaseFunction(ease);

  return (
    <HStack spacing={4} className={className} flexWrap="wrap" justify="center">
      {logo && (
        <Image 
          src={logo} 
          alt={logoAlt} 
          h={8} 
          w="auto"
          objectFit="contain"
        />
      )}
      {items.map((item, index) => {
        const isHovered = hoveredIndex === index;
        const isActive = item.href === activeHref;
        
        return (
          <Box
            key={index}
            as="button"
            px={6}
            py={3}
            borderRadius="full"
            bg={isHovered ? baseColor : pillColor}
            color={isHovered ? hoveredPillTextColor : pillTextColor}
            border="2px solid"
            borderColor={baseColor}
            fontWeight="bold"
            fontSize="md"
            position="relative"
            overflow="hidden"
            transition={`all 0.4s ${transitionTiming}`}
            transform={isHovered ? "scale(1.08)" : "scale(1)"}
            boxShadow={isHovered ? "xl" : "md"}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            cursor="pointer"
            minW="80px"
            _hover={{
              transform: "scale(1.08)",
              boxShadow: "xl"
            }}
          >
            {/* Background color transition */}
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg={baseColor}
              opacity={isHovered ? 1 : 0}
              transition={`opacity 0.4s ${transitionTiming}`}
              zIndex={0}
            />
            
            {/* Default label (percentage) */}
            <Text
              position="relative"
              zIndex={1}
              transition={`opacity 0.3s ${transitionTiming}, transform 0.3s ${transitionTiming}`}
              opacity={isHovered ? 0 : 1}
              transform={isHovered ? "translateY(-10px)" : "translateY(0)"}
              display="block"
            >
              {item.label}
            </Text>
            
            {/* Hover label (count) */}
            <Text
              position="absolute"
              top="50%"
              left="50%"
              transform={isHovered ? "translate(-50%, -50%)" : "translate(-50%, 10px)"}
              zIndex={1}
              transition={`opacity 0.3s ${transitionTiming}, transform 0.3s ${transitionTiming}`}
              opacity={isHovered ? 1 : 0}
              color={hoveredPillTextColor}
              fontWeight="bold"
              whiteSpace="nowrap"
            >
              {item.hoverLabel || item.label}
            </Text>
          </Box>
        );
      })}
    </HStack>
  );
};

export default PillNav;

