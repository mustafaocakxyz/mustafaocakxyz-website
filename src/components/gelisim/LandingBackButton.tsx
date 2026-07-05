import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 138, 101, 0.2);
  text-decoration: none;
  transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.95);
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 138, 101, 0.35);
  }
`;

export function LandingBackButton() {
  return (
    <BackLink to="/" aria-label="Ana sayfaya dön">
      <ArrowLeft size={20} />
    </BackLink>
  );
}
