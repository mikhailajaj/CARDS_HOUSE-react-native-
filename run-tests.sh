#!/bin/bash

# Comprehensive Test Execution Script for Tarneeb Card Game
# This script runs all tests with coverage and generates reports

echo "================================================"
echo "   Tarneeb Card Game - Test Suite Runner"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
fi

# Parse command line arguments
TEST_MODE="all"
WATCH_MODE=false
COVERAGE_MODE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --watch|-w)
            WATCH_MODE=true
            shift
            ;;
        --coverage|-c)
            COVERAGE_MODE=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --unit|-u)
            TEST_MODE="unit"
            shift
            ;;
        --integration|-i)
            TEST_MODE="integration"
            shift
            ;;
        --components|-comp)
            TEST_MODE="components"
            shift
            ;;
        --help|-h)
            echo "Usage: ./run-tests.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -w, --watch         Run tests in watch mode"
            echo "  -c, --coverage      Generate coverage report"
            echo "  -v, --verbose       Verbose output"
            echo "  -u, --unit          Run only unit tests"
            echo "  -i, --integration   Run only integration tests"
            echo "  -comp, --components Run only component tests"
            echo "  -h, --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run-tests.sh --coverage          # Run all tests with coverage"
            echo "  ./run-tests.sh --unit --watch      # Run unit tests in watch mode"
            echo "  ./run-tests.sh --verbose           # Run all tests with verbose output"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build test command
CMD="npm test --"

if [ "$TEST_MODE" = "unit" ]; then
    print_status "Running UNIT tests only..."
    CMD="$CMD __tests__/unit"
elif [ "$TEST_MODE" = "integration" ]; then
    print_status "Running INTEGRATION tests only..."
    CMD="$CMD __tests__/integration"
elif [ "$TEST_MODE" = "components" ]; then
    print_status "Running COMPONENT tests only..."
    CMD="$CMD __tests__/components"
else
    print_status "Running ALL tests..."
fi

if [ "$WATCH_MODE" = true ]; then
    CMD="$CMD --watch"
    print_status "Watch mode enabled"
fi

if [ "$COVERAGE_MODE" = true ]; then
    CMD="$CMD --coverage"
    print_status "Coverage reporting enabled"
fi

if [ "$VERBOSE" = true ]; then
    CMD="$CMD --verbose"
    print_status "Verbose mode enabled"
fi

echo ""
print_status "Executing: $CMD"
echo ""

# Run the tests
eval $CMD
TEST_EXIT_CODE=$?

echo ""
echo "================================================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "All tests passed! ✓"
    
    if [ "$COVERAGE_MODE" = true ]; then
        echo ""
        print_status "Coverage report generated in: coverage/"
        print_status "View HTML report: coverage/lcov-report/index.html"
        
        # Check if coverage thresholds met
        if [ -f "coverage/coverage-summary.json" ]; then
            print_status "Coverage summary:"
            cat coverage/coverage-summary.json | grep -A 4 "total"
        fi
    fi
else
    print_error "Some tests failed! ✗"
    print_warning "Review the output above for details"
fi

echo "================================================"
echo ""

exit $TEST_EXIT_CODE
