#!/bin/bash
set -e

# Docker Build Script for Overseerr Content Filtering
# This script builds the Docker image locally for testing purposes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
IMAGE_NAME="larrikinau/overseerr-content-filtering"
TAG="local"
PLATFORM="linux/amd64"
BUILD_ARGS=""

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Build Docker image for Overseerr Content Filtering"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -t, --tag TAG       Docker image tag (default: local)"
    echo "  -p, --platform PLAT Target platform (default: linux/amd64)"
    echo "  --multi-platform    Build for multiple platforms (amd64, arm64, armv7)"
    echo "  --push              Push image to registry (requires login)"
    echo "  --no-cache          Build without using cache"
    echo ""
    echo "Examples:"
    echo "  $0                                  # Build with default settings"
    echo "  $0 -t v1.1.0                      # Build with specific tag"
    echo "  $0 --multi-platform --push        # Build multi-platform and push"
    echo "  $0 --no-cache                     # Build without cache"
}

# Parse arguments
MULTI_PLATFORM=false
PUSH=false
NO_CACHE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        --multi-platform)
            MULTI_PLATFORM=true
            shift
            ;;
        --push)
            PUSH=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Build info
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}  Overseerr Content Filtering Docker Build${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "Image: ${GREEN}${IMAGE_NAME}:${TAG}${NC}"

if [ "$MULTI_PLATFORM" = true ]; then
    echo -e "Platform: ${GREEN}linux/amd64,linux/arm64,linux/arm/v7${NC}"
    PLATFORM="linux/amd64,linux/arm64,linux/arm/v7"
else
    echo -e "Platform: ${GREEN}${PLATFORM}${NC}"
fi

echo -e "Push: ${GREEN}${PUSH}${NC}"
echo -e "Cache: ${GREEN}$([ "$NO_CACHE" = true ] && echo "disabled" || echo "enabled")${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running or not accessible.${NC}"
    exit 1
fi

# Get commit information
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "")

echo -e "${YELLOW}Git commit: ${GIT_SHA}${NC}"
if [ -n "$GIT_TAG" ]; then
    echo -e "${YELLOW}Git tag: ${GIT_TAG}${NC}"
fi
echo ""

# Prepare build arguments
BUILD_ARGS="--build-arg COMMIT_TAG=${GIT_SHA}"

if [ "$NO_CACHE" = true ]; then
    BUILD_ARGS="$BUILD_ARGS --no-cache"
fi

# Setup buildx for multi-platform builds
if [ "$MULTI_PLATFORM" = true ]; then
    echo -e "${YELLOW}Setting up Docker buildx for multi-platform build...${NC}"
    
    # Create builder instance if it doesn't exist
    if ! docker buildx inspect overseerr-builder > /dev/null 2>&1; then
        docker buildx create --name overseerr-builder --driver docker-container --bootstrap
    fi
    
    docker buildx use overseerr-builder
    
    # Build command for multi-platform
    BUILD_CMD="docker buildx build"
    BUILD_ARGS="$BUILD_ARGS --platform $PLATFORM"
    
    if [ "$PUSH" = true ]; then
        BUILD_ARGS="$BUILD_ARGS --push"
    else
        BUILD_ARGS="$BUILD_ARGS --load"
        echo -e "${YELLOW}Note: Multi-platform builds without --push will only load the native platform image${NC}"
    fi
else
    # Standard build command
    BUILD_CMD="docker build"
    BUILD_ARGS="$BUILD_ARGS --platform $PLATFORM"
fi

# Add image tag
BUILD_ARGS="$BUILD_ARGS -t ${IMAGE_NAME}:${TAG}"

# Build the image
echo -e "${YELLOW}Building Docker image...${NC}"
echo -e "${BLUE}Command: ${BUILD_CMD} ${BUILD_ARGS} .${NC}"
echo ""

if $BUILD_CMD $BUILD_ARGS .; then
    echo ""
    echo -e "${GREEN}✅ Docker image built successfully!${NC}"
    
    if [ "$PUSH" = false ] && [ "$MULTI_PLATFORM" = false ]; then
        echo ""
        echo -e "${YELLOW}To test the image locally:${NC}"
        echo "docker run -d --name overseerr-content-filtering-test \\"
        echo "  -p 5055:5055 \\"
        echo "  -v overseerr-test-config:/app/config \\"
        echo "  ${IMAGE_NAME}:${TAG}"
        echo ""
        echo -e "${YELLOW}To push the image:${NC}"
        echo "docker push ${IMAGE_NAME}:${TAG}"
    fi
    
    if [ "$PUSH" = true ]; then
        echo -e "${GREEN}✅ Image pushed to registry successfully!${NC}"
    fi
else
    echo ""
    echo -e "${RED}❌ Docker build failed!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Build completed!${NC}"
