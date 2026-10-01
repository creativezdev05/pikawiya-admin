type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // "dark" is for sections that are permanently dark regardless of the site
  // theme (e.g. the Submitted Forms table), not tied to the dark: variant.
  variant?: "light" | "dark";
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  variant = "light",
}) => {
  const pagesAroundCurrent = Array.from(
    { length: Math.min(3, totalPages) },
    (_, i) => i + Math.max(currentPage - 1, 1),
  );

  const navButtonClass =
    variant === "dark"
      ? "flex h-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-gray-300 shadow-theme-xs hover:bg-gray-700 disabled:opacity-50"
      : "flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3";
  const pageInactiveClass =
    variant === "dark" ? "text-gray-300" : "text-gray-700 dark:text-gray-400";
  const pageHoverClass =
    variant === "dark"
      ? "hover:bg-white/5 hover:text-brand-400"
      : "hover:bg-blue-500/8 hover:text-brand-500 dark:hover:text-brand-500";

  return (
    <div className="flex items-center">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`me-2.5 ${navButtonClass}`}
      >
        Previous
      </button>
      <div className="flex items-center gap-2">
        {currentPage > 3 && <span className="px-2">...</span>}
        {pagesAroundCurrent.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
              currentPage === page ? "bg-brand-500 text-white" : pageInactiveClass
            } ${pageHoverClass}`}
          >
            {page}
          </button>
        ))}
        {currentPage < totalPages - 2 && <span className="px-2">...</span>}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`ms-2.5 ${navButtonClass}`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
