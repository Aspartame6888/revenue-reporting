import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import { Layout } from 'antd';
// import 'antd/dist/antd.css';

const { Header, Content, Footer } = Layout;

function App() {
  return (
    <Layout className="layout">
      <Header>
        <div className="logo" />
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Revenue Reporting ©2024</Footer>
    </Layout>
  );
}

export default App;
