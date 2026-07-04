import type { LucideIcon } from 'lucide-react';
import { CTAButton } from '../components/CTAButton';
import { FeatureCard } from '../components/FeatureCard';
import { GradientTitle } from '../components/GradientTitle';
import { DetailLayout, FeatureList } from '../components/PageLayout';
import type { ThemeColor } from '../styles/theme';

export type FeatureItem = {
  text: string;
  icon: LucideIcon;
};

type DetailPageProps = {
  title: string;
  features: FeatureItem[];
  ctaLabel: string;
  theme: ThemeColor;
  ctaTo?: string;
  onCtaClick?: () => void;
};

export function DetailPage({
  title,
  features,
  ctaLabel,
  theme,
  ctaTo,
  onCtaClick,
}: DetailPageProps) {
  const delays = ['0.4s', '0.6s', '0.8s', '1s'];

  return (
    <DetailLayout>
      <GradientTitle $detail>{title}</GradientTitle>
      <FeatureList>
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.text}
            text={feature.text}
            icon={feature.icon}
            theme={theme}
            animationDelay={delays[index] ?? `${0.4 + index * 0.2}s`}
          />
        ))}
      </FeatureList>
      <CTAButton theme={theme} to={ctaTo} onClick={onCtaClick}>
        {ctaLabel}
      </CTAButton>
    </DetailLayout>
  );
}
