import {
  blueButtonGradient,
  orangeButtonGradient,
  type ThemeColor,
} from './theme';

export type FormAccent = {
  inputBorder: string;
  inputBorderFocus: string;
  choiceBorder: string;
  choiceBorderSelected: string;
  choiceBorderHover: string;
  choiceBgSelected: string;
  choiceBgSelectedHover: string;
  progressActive: string;
  buttonGradient: string;
  buttonShadow: string;
  buttonShadowHover: string;
  emptyBorder: string;
  emptyBg: string;
};

const formAccents: Record<ThemeColor, FormAccent> = {
  blue: {
    inputBorder: 'rgba(66, 165, 245, 0.25)',
    inputBorderFocus: 'rgba(66, 165, 245, 0.6)',
    choiceBorder: 'rgba(66, 165, 245, 0.25)',
    choiceBorderSelected: 'rgba(66, 165, 245, 0.6)',
    choiceBorderHover: 'rgba(66, 165, 245, 0.45)',
    choiceBgSelected: 'rgba(33, 150, 243, 0.18)',
    choiceBgSelectedHover: 'rgba(33, 150, 243, 0.22)',
    progressActive: 'rgba(33, 150, 243, 0.6)',
    buttonGradient: blueButtonGradient,
    buttonShadow: '0 8px 25px rgba(21, 101, 192, 0.3)',
    buttonShadowHover: '0 12px 35px rgba(21, 101, 192, 0.4)',
    emptyBorder: 'rgba(66, 165, 245, 0.35)',
    emptyBg: 'rgba(21, 101, 192, 0.12)',
  },
  orange: {
    inputBorder: 'rgba(255, 138, 101, 0.25)',
    inputBorderFocus: 'rgba(255, 138, 101, 0.6)',
    choiceBorder: 'rgba(255, 138, 101, 0.25)',
    choiceBorderSelected: 'rgba(255, 138, 101, 0.6)',
    choiceBorderHover: 'rgba(255, 138, 101, 0.45)',
    choiceBgSelected: 'rgba(244, 81, 30, 0.18)',
    choiceBgSelectedHover: 'rgba(244, 81, 30, 0.22)',
    progressActive: 'rgba(244, 81, 30, 0.6)',
    buttonGradient: orangeButtonGradient,
    buttonShadow: '0 8px 25px rgba(216, 67, 21, 0.3)',
    buttonShadowHover: '0 12px 35px rgba(216, 67, 21, 0.4)',
    emptyBorder: 'rgba(255, 138, 101, 0.35)',
    emptyBg: 'rgba(191, 54, 12, 0.12)',
  },
};

export function getFormAccent(theme: ThemeColor = 'blue'): FormAccent {
  return formAccents[theme];
}
