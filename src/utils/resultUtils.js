/**
 * Generates mock data for water quality results.
 */
export const generateAllMockResults = () => {
    const results = [];
    const locations = ['수원지A', '수원지B', '수원지C'];
    const baseDate = new Date('2024-01-01');

    for (let i = 0; i < 3000; i++) {
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
 * Generates mock data for water usage (consumption).
 */
export const generateUsageData = () => {
    const results = [];
    const regions = ['서울_강남', '서울_강북', '경기도_성남', '경기도_수원', '인천_연수', '강원_춘천', '충청_대전', '전라_광주', '경상_부산', '제주'];
    const baseDate = new Date('2024-01-01');

    for (let i = 0; i < 2000; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + (i % 365));

        results.push({
            '번호': i + 1,
            '측정일자': date.toISOString().slice(0, 10),
            '지역': regions[i % regions.length],
            '가정용_사용량': Math.floor(500 + Math.random() * 1500),
            '산업용_사용량': Math.floor(2000 + Math.random() * 5000),
            '공공용_사용량': Math.floor(300 + Math.random() * 800),
            '누수량': Math.floor(10 + Math.random() * 100),
            '유수율': (85 + Math.random() * 14).toFixed(1) + '%',
            '청구금액': Math.floor(1000000 + Math.random() * 5000000)
        });
    }

    return results;
};

/**
 * Generates mock data for facility status.
 */
export const generateFacilityData = () => {
    const results = [];
    const facilityTypes = ['정수장', '배수지', '가압장', '취수장'];
    const statuses = ['정상', '점검중', '주의', '수리중'];

    for (let i = 0; i < 50; i++) {
        results.push({
            '시설ID': `FAC-${1000 + i}`,
            '시설명': `${facilityTypes[i % 4]} ${String.fromCharCode(65 + (i % 5))}-${i}`,
            '종류': facilityTypes[i % 4],
            '가동상태': statuses[Math.floor(Math.random() * statuses.length)],
            '최근점검일': new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10),
            '담당자': ['김철수', '이영희', '박민수', '정지훈'][i % 4],
            '가동률': (Math.random() * 100).toFixed(1) + '%',
            '전력소비량': Math.floor(100 + Math.random() * 900) + ' kWh'
        });
    }

    return results;
};

/**
 * Selector for mock data based on table name reference.
 */
export const getMockData = (tableName) => {
    if (!tableName) return generateAllMockResults();

    const lowerName = tableName.toLowerCase();

    if (lowerName.includes('quality') || lowerName.includes('수질')) {
        return generateAllMockResults();
    }
    if (lowerName.includes('usage') || lowerName.includes('사용량')) {
        return generateUsageData();
    }
    if (lowerName.includes('facility') || lowerName.includes('시설') || lowerName.includes('maintenance')) {
        return generateFacilityData();
    }

    return generateAllMockResults();
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
            rowCount: 50000
        },
        {
            table: 'water_usage',
            columns: [
                { name: 'id', type: 'INT', key: 'PRI', nullable: false },
                { name: 'usage_date', type: 'DATE', key: 'MUL', nullable: false },
                { name: 'region', type: 'VARCHAR(100)', key: 'MUL', nullable: false },
                { name: 'household_usage', type: 'INT', key: '', nullable: true },
                { name: 'industrial_usage', type: 'INT', key: '', nullable: true },
                { name: 'public_usage', type: 'INT', key: '', nullable: true },
                { name: 'leakage_amount', type: 'INT', key: '', nullable: true },
                { name: 'revenue_water_ratio', type: 'DECIMAL(5,2)', key: '', nullable: true },
                { name: 'billing_amount', type: 'BIGINT', key: '', nullable: true },
            ],
            indexes: ['PRIMARY', 'idx_usage_date', 'idx_region'],
            rowCount: 2000
        },
        {
            table: 'facility_status',
            columns: [
                { name: 'facility_id', type: 'VARCHAR(20)', key: 'PRI', nullable: false },
                { name: 'facility_name', type: 'VARCHAR(100)', key: '', nullable: false },
                { name: 'type', type: 'VARCHAR(50)', key: 'MUL', nullable: false },
                { name: 'status', type: 'VARCHAR(20)', key: 'MUL', nullable: false },
                { name: 'last_check_date', type: 'DATE', key: '', nullable: true },
                { name: 'manager', type: 'VARCHAR(50)', key: '', nullable: true },
                { name: 'operation_rate', type: 'DECIMAL(5,2)', key: '', nullable: true },
                { name: 'power_consumption', type: 'INT', key: '', nullable: true },
            ],
            indexes: ['PRIMARY', 'idx_status', 'idx_type'],
            rowCount: 50
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
