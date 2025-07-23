import React, { useEffect, useState, useCallback } from "react";
import { Link, useLoaderData } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
  faCode,
  faFilter,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import {
  type Problem,
  type ProblemType,
} from "~/lib/server-actions/problems";
import RatingDisplay from "~/components/RatingDisplay";
import CourseSelector from "~/components/CourseSelector";
import Loading from "~/components/Loading";
import { getBadgeColor } from "~/lib/badge";
import "~/styles/rating.css";
import "~/styles/table.css";
import type { Route } from "./+types/problems";
import { Config } from "~/config";

const PROBLEMS_PER_PAGE = 25;

type SortField = "name" | "rating" | "course";
type SortOrder = "asc" | "desc" | null;

const PROBLEM_TYPES: ProblemType[] = [
  "Art",
  "Business",
  "Communication",
  "Crime",
  "Economy",
  "Education",
  "Environment",
  "Family and children",
  "Food",
  "Health",
  "Language",
  "Media",
  "Reading",
  "Technology",
  "Transport",
  "Travel",
];

export async function loader({}: Route.LoaderArgs): Promise<{
  problems: Problem[];
  courses: any[];
}> {
  try {
    const baseUrl =
      process.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      "https://api.example.com";

    // Fetch both problems and courses in parallel
    const [problemsResponse, coursesResponse] = await Promise.all([
      fetch(new URL("/api/problems", baseUrl).toString()),
      fetch(new URL("/api/courses", baseUrl).toString()),
    ]);

    const problems = problemsResponse.ok
      ? ((await problemsResponse.json()) as Problem[])
      : [];
    const courses = coursesResponse.ok
      ? ((await coursesResponse.json()) as any[])
      : [{ id: "default", name: "Default Course" }];

    return { problems, courses };
  } catch (error) {
    console.error("Error loading data:", error);
    return {
      problems: [],
      courses: [{ id: "default", name: "Default Course" }],
    };
  }
}

export function meta({}: Route.MetaArgs): Route.MetaDescriptors {
  return [
    { title: `Problems - ${Config.siteDescription}` },
    {
      name: "description",
      content: `Browse programming problems and challenges on ${Config.sitename}. Filter by course, type, and difficulty.`,
    },
  ];
}

export default function Problems() {
  const { problems: initialProblems, courses } = useLoaderData<{
    problems: Problem[];
    courses: any[];
  }>();
  const [problems, setProblems] = useState<Problem[]>(initialProblems || []);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("rating");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedProblemTypes, setSelectedProblemTypes] = useState<
    ProblemType[]
  >([]);

  // Initialize with first course from loader
  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    setProblems(initialProblems || []);
  }, [initialProblems]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return faSort;
    if (sortOrder === "asc") return faSortUp;
    if (sortOrder === "desc") return faSortDown;
    return faSort;
  };

  const sortProblems = useCallback(
    (problems: Problem[]) => {
      if (!sortField || !sortOrder) return problems;

      return [...problems].sort((a, b) => {
        let aValue: number | string;
        let bValue: number | string;

        switch (sortField) {
          case "name":
            aValue = a.name;
            bValue = b.name;
            if (typeof aValue === "string" && typeof bValue === "string") {
              return sortOrder === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            }
            break;
          case "rating":
            aValue = a.rating;
            bValue = b.rating;
            const ratingComparison = (aValue as number) - (bValue as number);
            return sortOrder === "asc" ? ratingComparison : -ratingComparison;
          case "course":
            aValue = a.course.name;
            bValue = b.course.name;
            if (typeof aValue === "string" && typeof bValue === "string") {
              return sortOrder === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            }
            break;
          default:
            return 0;
        }

        return 0;
      });
    },
    [sortField, sortOrder]
  );

  // Filter and sort problems
  useEffect(() => {
    let filtered = problems;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((problem) =>
        problem.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by course
    if (selectedCourseId && selectedCourseId !== "all") {
      filtered = filtered.filter(
        (problem) => problem.course.courseId === selectedCourseId
      );
    }

    // Filter by problem types
    if (selectedProblemTypes.length > 0) {
      filtered = filtered.filter((problem) =>
        problem.type.some((type) => selectedProblemTypes.includes(type))
      );
    }

    filtered = sortProblems(filtered);

    setFilteredProblems(filtered);
    setCurrentPage(1);
  }, [
    searchTerm,
    problems,
    sortField,
    sortOrder,
    selectedCourseId,
    selectedProblemTypes,
    sortProblems,
  ]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
  };

  const handleProblemTypeToggle = (type: ProblemType) => {
    setSelectedProblemTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearProblemTypeFilters = () => {
    setSelectedProblemTypes([]);
  };

  const totalPages = Math.ceil(filteredProblems.length / PROBLEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROBLEMS_PER_PAGE;
  const endIndex = startIndex + PROBLEMS_PER_PAGE;
  const currentProblems = filteredProblems.slice(startIndex, endIndex);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      {!isLoaded && <Loading />}
      <div
        className={`problems-page-container ${isLoaded ? "loaded" : "loading"}`}
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4 flex items-center">
            <FontAwesomeIcon icon={faCode} className="mr-2 text-blue-500" />
            Problems
          </h1>
          <hr className="mb-6" />

          {/* Filters */}
          <div className="space-y-4 mb-6">
            {/* Course Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Course:</span>
              <CourseSelector
                selectedCourseId={selectedCourseId}
                onCourseChange={handleCourseChange}
                courses={[...courses, { id: "all", name: "All Courses" }]}
              />
            </div>

            {/* Problem Type Filters */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faFilter}
                  className="text-sm text-muted-foreground"
                />
                <span className="text-sm font-medium">Problem Types:</span>
                {selectedProblemTypes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearProblemTypeFilters}
                    className="h-6 px-2 text-xs"
                  >
                    <FontAwesomeIcon icon={faX} className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {PROBLEM_TYPES.map((type) => (
                  <Button
                    key={type}
                    variant={
                      selectedProblemTypes.includes(type)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleProblemTypeToggle(type)}
                    className="h-7 px-3 text-xs"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="search-controls">
            <div className="search-input-container">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <Input
                type="text"
                placeholder="Search problems by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear
              </Button>
            )}
          </div>

          {/* Results info */}
          <div className="results-info">
            {isLoading ? (
              <span>Loading problems...</span>
            ) : (
              <>
                Showing {filteredProblems.length} problems
                {totalPages > 1 && (
                  <>
                    {" "}
                    • Page {currentPage} of {totalPages}
                  </>
                )}
                {selectedProblemTypes.length > 0 && (
                  <> • Filtered by: {selectedProblemTypes.join(", ")}</>
                )}
              </>
            )}
          </div>
        </div>

        {/* Problems Table */}
        <div className="table-wrapper">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr className="data-table-header">
                  <th
                    className="data-table-header-cell sortable"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Problem Name
                      <FontAwesomeIcon
                        icon={getSortIcon("name")}
                        className="w-3 h-3"
                      />
                    </div>
                  </th>
                  <th
                    className="data-table-header-cell center sortable"
                    onClick={() => handleSort("rating")}
                    style={{ width: "8rem" }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Rating
                      <FontAwesomeIcon
                        icon={getSortIcon("rating")}
                        className="w-3 h-3"
                      />
                    </div>
                  </th>
                  <th
                    className="data-table-header-cell"
                    style={{ width: "12rem" }}
                  >
                    Types
                  </th>
                  <th
                    className="data-table-header-cell sortable"
                    onClick={() => handleSort("course")}
                    style={{ width: "10rem" }}
                  >
                    <div className="flex items-center gap-2">
                      Course
                      <FontAwesomeIcon
                        icon={getSortIcon("course")}
                        className="w-3 h-3"
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="data-table-body-cell center"
                      style={{ height: "6rem" }}
                    >
                      <div className="flex items-center justify-center">
                        <Loading />
                      </div>
                    </td>
                  </tr>
                ) : currentProblems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="data-table-body-cell center"
                      style={{ height: "6rem" }}
                    >
                      <span className="text-muted-foreground">
                        {searchTerm || selectedProblemTypes.length > 0
                          ? "No problems found matching your filters."
                          : "No problems available."}
                      </span>
                    </td>
                  </tr>
                ) : (
                  currentProblems.map((problem) => (
                    <tr key={problem.problemId} className="data-table-body-row">
                      <td className="data-table-body-cell">
                        <Link
                          to={`/problem/${problem.problemId}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {problem.name}
                        </Link>
                      </td>
                      <td
                        className="data-table-body-cell center"
                        style={{ verticalAlign: "middle" }}
                      >
                        <RatingDisplay
                          rating={Math.round(problem.rating)}
                          showIcon={true}
                        />
                      </td>
                      <td className="data-table-body-cell">
                        <div className="flex flex-wrap gap-1">
                          {problem.type.map((type) => (
                            <Badge
                              key={type}
                              variant="secondary"
                              className={`text-white ${getBadgeColor(
                                type
                              )} text-xs`}
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="data-table-body-cell">
                        <span className="text-sm text-muted-foreground">
                          {problem.course.name}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 7) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 4) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNumber = totalPages - 6 + i;
                  } else {
                    pageNumber = currentPage - 3 + i;
                  }

                  if (
                    pageNumber === currentPage - 2 &&
                    currentPage > 4 &&
                    totalPages > 7
                  ) {
                    return (
                      <PaginationItem key="ellipsis-start">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  if (
                    pageNumber === currentPage + 2 &&
                    currentPage < totalPages - 3 &&
                    totalPages > 7
                  ) {
                    return (
                      <PaginationItem key="ellipsis-end">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Footer info */}
        {currentProblems.length > 0 && (
          <div className="mt-6 text-sm text-muted-foreground">
            <p>Click on a problem name to view details and start solving.</p>
          </div>
        )}
      </div>
    </main>
  );
}
