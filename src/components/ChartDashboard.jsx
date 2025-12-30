import React from 'react';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer
} from 'recharts';

const ChartDashboard = ({ displayedResults }) => {
    const chartData = displayedResults.slice(0, 50);
    const barData = displayedResults.slice(0, 20);

    return (
        <div className="charts-container">
            <div className="chart-section">
                <h4>▸ pH 수치 추이</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="측정일시"
                            tick={{ fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="pH수치"
                            stroke="#1a73e8"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            name="pH 수치"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-section">
                <h4>▸ 위치별 탁도 비교</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="위치" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="탁도" fill="#10b981" name="탁도" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-section">
                <h4>▸ 시간별 온도 변화</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="측정일시"
                            tick={{ fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="온도"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            name="온도 (°C)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartDashboard;
