import type { Metadata } from 'next';
import { StrategyGameHome } from '@/features/strategyGame';

export const metadata: Metadata = {
  title: 'Il Consiglio del Genetliaco',
  description:
    'Una mini-avventura di compleanno tra sigilli, decreti e sospetti cerimoniali.',
};

const Home: React.FC = () => <StrategyGameHome />;

export default Home;
