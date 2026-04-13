import { TextStyle } from 'react-native';

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  } as TextStyle,
  
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.3,
  } as TextStyle,
  
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  } as TextStyle,
  
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  } as TextStyle,
  
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  } as TextStyle,
  
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,
  
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } as TextStyle,
  
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  } as TextStyle,
  
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  } as TextStyle,
  
  songLyrics: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 30,
    letterSpacing: 0.2,
  } as TextStyle,
  
  songNumber: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  } as TextStyle,
} as const;
