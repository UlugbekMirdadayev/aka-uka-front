import React, { useState } from "react";
import "../styles/table.css";
import { Loader } from "../assets/icons";

const Table = ({
  columns,
  data,
  onRowClick,
  sortable = true,
  pagination,
  pageSize = 10,
  className = "",
  loading = false,
}) => {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Определяем, используется ли внешняя пагинация
  const isExternalPagination =
    pagination && typeof pagination === "object" && pagination.onPageChange;
  const usePagination = pagination !== false;

  const handleSort = (key) => {
    if (!sortable) return;

    let direction = "asc";

    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
        key = null;
      } else {
        direction = "asc";
      }
    } else {
      direction = "asc";
    }

    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || isExternalPagination) return data || [];

    return [...(data || [])].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig, isExternalPagination]);

  // Внутренняя пагинация
  const currentPage = isExternalPagination
    ? pagination.current
    : internalCurrentPage;
  const totalPages = isExternalPagination
    ? pagination.pages
    : Math.ceil(sortedData.length / pageSize);

  const paginatedData = isExternalPagination
    ? sortedData
    : sortedData.slice(
        (internalCurrentPage - 1) * pageSize,
        internalCurrentPage * pageSize
      );

  const handlePageChange = (page) => {
    if (isExternalPagination) {
      pagination.onPageChange(page);
    } else {
      setInternalCurrentPage(page);
    }
  };

  React.useEffect(() => {
    setInternalCurrentPage(1);
  }, [columns]);

  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                onClick={() =>
                  column.key
                    ? handleSort(column.key)
                    : setSortConfig({ key: null, direction: "asc" })
                }
                className={sortable ? "sortable" : ""}
                style={column.style}
              >
                {column.title}
                <span
                  className={`sort-icon ${
                    sortConfig.direction === "asc" ? "up" : "down"
                  } ${sortConfig.key === column.key ? "visible" : ""}`}
                >
                  {sortConfig.direction === "asc" ? "↑" : "↓"}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: "center", padding: "1rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    flexDirection: "column",
                    height: "100px",
                  }}
                >
                  <Loader />
                  <span>Yuklanmoqda...</span>
                </div>
              </td>
            </tr>
          ) : paginatedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: "center", padding: "1rem" }}
              >
                Ma’lumot topilmadi
              </td>
            </tr>
          ) : (
            paginatedData.map((row, index) => (
              <tr
                key={index}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? "clickable" : ""}
              >
                {columns.map((column, index_) => (
                  <td key={column.key || index_} style={column.style}>
                    {column.render
                      ? column.render(row[column.key], row,index)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {usePagination && totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Orqaga
          </button>
          <span>
            Sahifa {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Oldinga
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;
