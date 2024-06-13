import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Spin } from 'antd';
import ReactEcharts from 'echarts-for-react';

const Home = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL + '/income';

    axios.get(apiUrl)
      .then(response => {
        setData(response.data.incomeList);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Region', dataIndex: 'region', key: 'region' },
    { title: 'Custom ID', dataIndex: 'customId', key: 'customId' },
    { title: 'Media', dataIndex: 'media', key: 'media' },
    { title: 'Currency', dataIndex: 'currency', key: 'currency' },
    { title: 'Income', dataIndex: 'income', key: 'income' },
    { title: 'Income Type', dataIndex: 'incomeType', key: 'incomeType' },
    { title: 'Custom App', dataIndex: 'customApp', key: 'customApp' },
    { title: 'Impressions', dataIndex: 'impressions', key: 'impressions' }
  ];

  const groupDataByCustomId = (data) => {
    const groupedData = data.reduce((acc, item) => {
      if (!acc[item.customId]) {
        acc[item.customId] = [];
      }
      acc[item.customId].push(item);
      return acc;
    }, {});
    return groupedData;
  };

  const getChartOptions = () => {
    const groupedData = groupDataByCustomId(data);
    const series = Object.keys(groupedData).map(customId => ({
      name: customId,
      type: 'line',
      data: groupedData[customId].map(item => ({
        value: item.income,
        ...item
      }))
    }));

    return {
      title: {
        text: 'Income Analysis',
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const data = params[0].data;
          return `
            Date: ${data.date}<br/>
            Brand: ${data.brand}<br/>
            Model: ${data.model}<br/>
            Region: ${data.region}<br/>
            Custom ID: ${data.customId}<br/>
            Media: ${data.media}<br/>
            Currency: ${data.currency}<br/>
            Income: ${data.income}<br/>
            Income Type: ${data.incomeType}<br/>
            Custom App: ${data.customApp}<br/>
            Impressions: ${data.impressions}
          `;
        }
      },
      legend: {
        data: Object.keys(groupedData)
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.date).filter((value, index, self) => self.indexOf(value) === index)
      },
      yAxis: {
        type: 'value',
        name: 'Income'
      },
      series: series
    };
  };

  return (
    <div>
      {loading ? (
        <Spin size="large" />
      ) : (
        <>
          <ReactEcharts option={getChartOptions()} style={{ height: '400px', marginBottom: '20px' }} />
          <Table dataSource={data} columns={columns} rowKey="date" />
        </>
      )}
    </div>
  );
};

export default Home;
