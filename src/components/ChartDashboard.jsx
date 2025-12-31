import React from 'react';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer
} from 'recharts';

const ChartDashboard = ({ displayedResults, originalQuery }) => {
    if (!displayedResults || displayedResults.length === 0) return null;

    const chartData = (displayedResults || []).slice(0, 50);
    const barData = (displayedResults || []).slice(0, 20);
    const firstRow = displayedResults && displayedResults.length > 0 ? displayedResults[0] : null;

    if (!firstRow) return null;

    const keys = Object.keys(firstRow);

    // Identify keywords from originalQuery
    const queryKeywords = originalQuery ? originalQuery.toLowerCase() : '';
    const mentionedKeys = keys.filter(k => queryKeywords.includes(k.toLowerCase()));

    // 1. Identify X-Axis candidate
    // Prioritize temporal columns, then categorical
    const temporalKeys = ['측정일시', '측정일자', '사용일자', '최근점검일', '일시', '일자', '날짜'];
    const categoricalKeys = ['위치', '지역', '시설명', '종류', '상태', '담당자'];

    // Prioritization:
    // 1. Mentioned temporal keys
    // 2. Default temporal keys
    // 3. Mentioned categorical keys
    // 4. Default categorical keys

    let xAxisKey = mentionedKeys.find(k => temporalKeys.includes(k));
    if (!xAxisKey) xAxisKey = keys.find(k => temporalKeys.includes(k));
    let isTemporal = !!xAxisKey;

    if (!xAxisKey) xAxisKey = mentionedKeys.find(k => categoricalKeys.includes(k));
    if (!xAxisKey) xAxisKey = keys.find(k => categoricalKeys.includes(k));

    if (!xAxisKey) {
        xAxisKey = keys[0]; // Fallback to first column
    }

    // 2. Identify Numeric Y-Axis candidates
    // Exclude IDs, keys, and non-numeric strings
    const excludeKeys = ['번호', 'id', 'ID', xAxisKey];

    const numericKeys = keys.filter(k => {
        if (excludeKeys.includes(k)) return false;

        const val = firstRow[k];
        // Check if value is numeric or represents a percentage/measurement
        if (typeof val === 'number') return true;
        if (typeof val === 'string') {
            // Remove %, commas, units and check if it's a number
            const cleaned = val.replace(/[%,k\/Wh\s가-힣]/g, '');
            return !isNaN(parseFloat(cleaned)) && isFinite(cleaned);
        }
        return false;
    });

    // Sort numeric keys: mentioned ones first
    const sortedNumericKeys = [...numericKeys].sort((a, b) => {
        const aMentioned = mentionedKeys.includes(a);
        const bMentioned = mentionedKeys.includes(b);
        if (aMentioned && !bMentioned) return -1;
        if (!aMentioned && bMentioned) return 1;
        return 0;
    });

    // Limit to top 3
    const topNumericKeys = sortedNumericKeys.slice(0, 3);

    // Function to parse numeric value from string (e.g., "95.5%" -> 95.5)
    const parseNumeric = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const cleaned = val.replace(/[%,k\/Wh\s가-힣]/g, '');
            return parseFloat(cleaned);
        }
        return 0;
    };

    // Prepare data by parsing numeric strings
    const processedData = chartData.map(row => {
        const newRow = { ...row };
        topNumericKeys.forEach(k => {
            newRow[`_num_${k}`] = parseNumeric(row[k]);
        });
        return newRow;
    });

    const processedBarData = barData.map(row => {
        const newRow = { ...row };
        topNumericKeys.forEach(k => {
            newRow[`_num_${k}`] = parseNumeric(row[k]);
        });
        return newRow;
    });

    return (
        <div className="charts-container">
            {topNumericKeys.map((yKey, index) => (
                <div key={yKey} className="chart-section">
                    <h4>▸ {xAxisKey}별 {yKey} {isTemporal ? '추이' : '비교'}</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        {isTemporal ? (
                            <LineChart data={processedData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey={xAxisKey}
                                    tick={{ fontSize: 10 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey={`_num_${yKey}`}
                                    stroke={['#1a73e8', '#10b981', '#f59e0b', '#ef4444'][index % 4]}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    name={yKey}
                                />
                            </LineChart>
                        ) : (
                            <BarChart data={processedBarData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey={xAxisKey}
                                    tick={{ fontSize: 10 }}
                                    angle={xAxisKey.length > 5 ? -45 : 0}
                                    textAnchor={xAxisKey.length > 5 ? "end" : "middle"}
                                    height={xAxisKey.length > 5 ? 80 : 30}
                                />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey={`_num_${yKey}`}
                                    fill={['#1a73e8', '#10b981', '#f59e0b', '#ef4444'][index % 4]}
                                    name={yKey}
                                />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            ))}

            {topNumericKeys.length === 0 && (
                <div className="empty-state" style={{ padding: '40px' }}>
                    <p>시각화할 수 있는 수치 데이터가 결과에 포함되어 있지 않습니다.</p>
                </div>
            )}
        </div>
    );
};

export default ChartDashboard;
