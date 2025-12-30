/**
 * Generates mock data for water quality results.
 */
export const generateAllMockResults = () => {
    const results = [];
    const locations = ['수원지A', '수원지B', '수원지C'];
    const baseDate = new Date('2024-01-01');

    for (let i = 0; i < 1000; i++) {
        const date = new Date(baseDate);
        date.setHours(date.getHours() + i);

        results.push({
            '번호': i + 1,
            '측정일시': date.toISOString().slice(0, 16).replace('T', ' '),
            '위치': locations[i % 3],
            'pH수치': (6.5 + Math.random() * 1.5).toFixed(2),
            '탁도': (0.3 + Math.random() * 1.2).toFixed(2),
            '온도': (12 + Math.random() * 8).toFixed(1),
            '잔류염소': (0.1 + Math.random() * 0.4).toFixed(3),
            '총유기탄소': (1.0 + Math.random() * 2.5).toFixed(2),
            '암모니아성질소': (0.01 + Math.random() * 0.1).toFixed(3),
            '전기전도도': (150 + Math.random() * 300).toFixed(0)
        });
    }

    return results;
};

/**
 * Generates mock schema data.
 */
export const generateSchemaData = () => {
    return [
        {
            table: 'water_quality',
            columns: [
                { name: 'id', type: 'INT', key: 'PRI', nullable: false },
                { name: 'measurement_date', type: 'DATETIME', key: 'MUL', nullable: false },
                { name: 'location', type: 'VARCHAR(100)', key: 'MUL', nullable: false },
                { name: 'ph_level', type: 'DECIMAL(4,2)', key: '', nullable: true },
                { name: 'turbidity', type: 'DECIMAL(5,2)', key: '', nullable: true },
                { name: 'temperature', type: 'DECIMAL(5,2)', key: '', nullable: true },
                { name: 'residual_chlorine', type: 'DECIMAL(5,3)', key: '', nullable: true },
                { name: 'toc', type: 'DECIMAL(5,2)', key: '', nullable: true },
                { name: 'ammonia_nitrogen', type: 'DECIMAL(5,3)', key: '', nullable: true },
                { name: 'conductivity', type: 'INT', key: '', nullable: true },
            ],
            indexes: ['PRIMARY', 'idx_measurement_date', 'idx_location'],
            rowCount: 15420
        },
        {
            table: 'water_sources',
            columns: [
                { name: 'id', type: 'INT', key: 'PRI', nullable: false },
                { name: 'name', type: 'VARCHAR(100)', key: '', nullable: false },
                { name: 'region', type: 'VARCHAR(50)', key: '', nullable: false },
                { name: 'capacity', type: 'INT', key: '', nullable: true },
            ],
            indexes: ['PRIMARY'],
            rowCount: 25
        }
    ];
};

/**
 * Downloads data as CSV.
 */
export const downloadExcel = (allResults) => {
    if (allResults.length === 0) return;

    // Create CSV content
    const headers = Object.keys(allResults[0]);
    const csvRows = [
        headers.join(','),
        ...allResults.map(row =>
            headers.map(header => {
                const value = row[header];
                // Escape values containing commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ];
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `query_results_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
