#!/bin/bash
cd /home/kavia/workspace/code-generation/auto-3d-inter-modeling-george---ai-build-3141-3013/CoverageVisualizationUI
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

