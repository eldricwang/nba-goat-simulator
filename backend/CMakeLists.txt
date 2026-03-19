cmake_minimum_required(VERSION 3.16)
project(nba-goat-backend CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include header-only libraries
include_directories(${CMAKE_SOURCE_DIR}/include)

# Find SQLite3
find_package(SQLite3 REQUIRED)

# Find threads (required by httplib)
find_package(Threads REQUIRED)

# Source files
set(SOURCES
    src/main.cpp
    src/players.cpp
    src/calculator.cpp
    src/comments.cpp
    src/api.cpp
    src/auth.cpp
)

add_executable(nba_backend ${SOURCES})

target_link_libraries(nba_backend
    SQLite::SQLite3
    Threads::Threads
)

# macOS specific
if(APPLE)
    target_link_libraries(nba_backend "-framework CoreFoundation" "-framework Security")
endif()
