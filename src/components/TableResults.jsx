import React from 'react';

const TableResults = ({
    displayedResults,
    visibleColumns,
    allResultsCount,
    tableContainerRef
}) => {
    return (
        <div className="table-container" ref={tableContainerRef}>
            <table className="results-table">
                <thead>
                    <tr>
                        {visibleColumns.map(key => (
                            <th key={key}>{key}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayedResults.map((row, idx) => (
                        <tr key={idx}>
                            {visibleColumns.map((key, i) => (
                                <td key={i}>{row[key]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {displayedResults.length < allResultsCount && (
                <div id="scroll-sentinel" className="scroll-sentinel">
                    <div className="loading-spinner">더 불러오는 중...</div>
                </div>
            )}
        </div>
    );
};

export default TableResults;
