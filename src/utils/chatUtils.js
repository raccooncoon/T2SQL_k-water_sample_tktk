/**
 * Analyzes the user query for ambiguity, intent, and context.
 */
export const analyzeQuery = (query, conversationContext = {}) => {
    const lowerQuery = query.toLowerCase();
    const analysis = {
        isAmbiguous: false,
        clarificationNeeded: [],
        assumptions: [],
        intent: 'general',
        isModification: false,
        isFollowUp: false
    };

    // Check if it's a modification request
    if (lowerQuery.includes('수정') || lowerQuery.includes('변경') ||
        lowerQuery.includes('바꿔') || lowerQuery.includes('다시') ||
        lowerQuery.includes('대신') || lowerQuery.includes('말고')) {
        analysis.isModification = true;
        analysis.intent = 'modify';

        if (!conversationContext.lastSQL) {
            analysis.assumptions.push('이전 쿼리가 없어 새로운 쿼리를 생성하겠습니다.');
        } else {
            analysis.assumptions.push(`이전 쿼리를 기반으로 수정하겠습니다.`);
        }
        return analysis;
    }

    // Check if it's a follow-up question
    if ((lowerQuery.includes('거기서') || lowerQuery.includes('그거') ||
        lowerQuery.includes('그것') || lowerQuery.includes('여기에') ||
        lowerQuery.includes('추가로') || lowerQuery.includes('그리고')) &&
        conversationContext.lastQuery) {
        analysis.isFollowUp = true;
        analysis.assumptions.push(`이전 질문 "${conversationContext.lastQuery}"을 참고하여 진행하겠습니다.`);
    }

    // 1. Check for time period ambiguity
    if ((lowerQuery.includes('최근') || lowerQuery.includes('데이터')) && !lowerQuery.match(/\d+/) && !lowerQuery.includes('오늘') && !lowerQuery.includes('어제')) {
        if (!lowerQuery.includes('7일') && !lowerQuery.includes('1개월') && !lowerQuery.includes('한달')) {
            analysis.isAmbiguous = true;
            analysis.clarificationNeeded.push({
                question: '조회하고 싶은 기간을 가르쳐 주시겠습니까?',
                options: ['최근 7일', '최근 1개월', '오늘 하루'],
                field: 'period'
            });
            analysis.assumptions.push('기간이 명시되지 않아 최근 7일 데이터로 가정합니다.');
        }
    }

    // 2. Check for location ambiguity
    if (lowerQuery.includes('수질') || lowerQuery.includes('데이터') || lowerQuery.includes('평균')) {
        if (!lowerQuery.includes('수원지') && !lowerQuery.includes('모든') && !lowerQuery.includes('전체') && !lowerQuery.includes('위치')) {
            analysis.isAmbiguous = true;
            analysis.clarificationNeeded.push({
                question: '어느 지역(수원지)의 데이터를 확인하시겠습니까?',
                options: ['전체 지역', '수원지A', '수원지B'],
                field: 'location'
            });
            analysis.assumptions.push('특정 위치가 지정되지 않아 전체 지역을 탐색합니다.');
        }
    }

    // 3. Check for indicator ambiguity (when '평균' or '통계' is mentioned)
    if (lowerQuery.includes('평균') || lowerQuery.includes('통계')) {
        if (!lowerQuery.includes('ph') && !lowerQuery.includes('탁도') && !lowerQuery.includes('온도')) {
            analysis.isAmbiguous = true;
            analysis.clarificationNeeded.push({
                question: '어떤 항목의 통계를 보시겠습니까?',
                options: ['pH 수치', '탁도', '온도', '전체 항목'],
                field: 'indicator'
            });
            analysis.assumptions.push('모든 수질 지표(pH, 탁도, 온도)의 요약 정보를 계산하겠습니다.');
        }
    }

    // 4. Check for abnormality criteria
    if (lowerQuery.includes('이상') || lowerQuery.includes('위험') || lowerQuery.includes('비정상') || lowerQuery.includes('문제')) {
        if (!lowerQuery.match(/\d+/) && !lowerQuery.includes('기준')) {
            analysis.isAmbiguous = true;
            analysis.clarificationNeeded.push({
                question: '비정상 데이터의 기준을 선택하시거나 직접 입력해 주세요.',
                options: ['pH 8.5 이상', '탁도 0.5 NTU 이상', '온도 25도 이상'],
                field: 'threshold'
            });
            analysis.assumptions.push('일반적인 수질 기준치를 넘는 데이터를 검색하겠습니다.');
        }
    }

    // Determine intent if not ambiguous or as a fallback
    if (lowerQuery.includes('평균')) {
        analysis.intent = 'average';
    } else if (lowerQuery.includes('최근') || lowerQuery.includes('조회')) {
        analysis.intent = 'recent';
    } else if (lowerQuery.includes('모든') || lowerQuery.includes('전체')) {
        analysis.intent = 'all';
    }

    // Very short queries
    if (lowerQuery.length < 3 && analysis.clarificationNeeded.length === 0) {
        analysis.isAmbiguous = true;
        analysis.clarificationNeeded.push({
            question: '도움이 필요하신 내용을 선택하시겠어요?',
            options: ['최근 수질 조회', '위치별 평균 통계', '수질 이상치 확인'],
            field: 'action'
        });
    }

    return analysis;
};

/**
 * Generates mock SQL based on analysis and query.
 */
export const generateMockSQL = (query, analysis, conversationContext = {}) => {
    const lowerQuery = query.toLowerCase();

    // Default values
    let selectClause = "SELECT id AS '번호', measurement_date AS '측정일시', location AS '위치', ph_level AS 'pH수치', turbidity AS '탁도', temperature AS '온도', residual_chlorine AS '잔류염소', toc AS '총유기탄소', ammonia_nitrogen AS '암모니아성질소', conductivity AS '전기전도도'";
    let fromClause = "FROM water_quality";
    let whereConditions = [];
    let groupByClause = "";
    let orderByClause = "ORDER BY measurement_date DESC";
    let limitClause = "LIMIT 100";

    // Handle modification requests
    if (analysis.isModification && conversationContext.lastSQL) {
        const lastSQL = conversationContext.lastSQL;
        if (lowerQuery.includes('제한') || lowerQuery.includes('limit') || lowerQuery.match(/\d+개/)) {
            const limitMatch = query.match(/(\d+)/);
            const newLimit = limitMatch ? limitMatch[1] : '50';
            return lastSQL.replace(/LIMIT \d+/i, `LIMIT ${newLimit}`);
        }
        if (lowerQuery.includes('오름차순') || lowerQuery.includes('asc')) {
            return lastSQL.replace(/DESC/gi, 'ASC');
        } else if (lowerQuery.includes('내림차순') || lowerQuery.includes('desc')) {
            return lastSQL.replace(/ASC/gi, 'DESC');
        }
        if (lowerQuery.includes('그룹') || lowerQuery.includes('group')) {
            const baseSQL = lastSQL.replace(/ORDER BY.*$/i, '');
            return baseSQL + '\nGROUP BY location\nORDER BY location;';
        }
    }

    // Parse Location
    if (lowerQuery.includes('수원지a')) {
        whereConditions.push("location = '수원지A'");
    } else if (lowerQuery.includes('수원지b')) {
        whereConditions.push("location = '수원지B'");
    }

    // Parse Period
    if (lowerQuery.includes('7일')) {
        whereConditions.push("measurement_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
    } else if (lowerQuery.includes('1개월') || lowerQuery.includes('한달')) {
        whereConditions.push("measurement_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)");
    } else if (lowerQuery.includes('오늘')) {
        whereConditions.push("DATE(measurement_date) = CURDATE()");
    } else if (lowerQuery.includes('최근')) {
        whereConditions.push("measurement_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
    }

    // Parse Thresholds (Abnormalities)
    if (lowerQuery.includes('ph 8.5 이상')) {
        whereConditions.push("ph_level >= 8.5");
    } else if (lowerQuery.includes('탁도 0.5')) {
        whereConditions.push("turbidity >= 0.5");
    } else if (lowerQuery.includes('온도 25')) {
        whereConditions.push("temperature >= 25");
    }

    // Handle Aggregation / Intent
    if (analysis.intent === 'average' || lowerQuery.includes('평균')) {
        if (lowerQuery.includes('ph')) {
            selectClause = "SELECT location AS '위치', AVG(ph_level) AS '평균_pH'";
        } else if (lowerQuery.includes('탁도')) {
            selectClause = "SELECT location AS '위치', AVG(turbidity) AS '평균_탁도'";
        } else if (lowerQuery.includes('온도')) {
            selectClause = "SELECT location AS '위치', AVG(temperature) AS '평균_온도'";
        } else {
            selectClause = "SELECT location AS '위치', AVG(ph_level) AS '평균_pH', AVG(turbidity) AS '평균_탁도', AVG(temperature) AS '평균_온도'";
        }
        groupByClause = "GROUP BY location";
        orderByClause = "ORDER BY location";
    }

    // Construct Final SQL
    let finalSQL = `${selectClause}\n${fromClause}`;
    if (whereConditions.length > 0) {
        finalSQL += `\nWHERE ${whereConditions.join('\n  AND ')}`;
    }
    if (groupByClause) {
        finalSQL += `\n${groupByClause}`;
    }
    finalSQL += `\n${orderByClause}\n${limitClause};`;

    return finalSQL;
};
