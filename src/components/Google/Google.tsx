import React from 'react';
import Search from './Search';
import Main from './Main';

interface GoogleProps {
  route?: string;
  query?: string;
  onSearch: (query: string) => void;
  goMain: () => void;
}

const Google: React.FC<GoogleProps> = ({ route = 'main', query = '', onSearch, goMain }) => {
  if (route === 'main') return <Main onSearch={onSearch} />;
  return <Search goMain={goMain} onSearch={onSearch} query={query} />;
};

export default Google;
