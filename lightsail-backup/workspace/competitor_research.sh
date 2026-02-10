echo "Starting analysis for Oniri..."
openclaw run-skill review-summarizer --query "Oniri Dream Journal" --stars 1-3 --limit 500
echo "Starting analysis for DreamKit..."
openclaw run-skill review-summarizer --query "DreamKit" --stars 1-3 --limit 500
echo "Starting analysis for Dream Journal Ultimate..."
openclaw run-skill review-summarizer --query "Dream Journal Ultimate" --stars 1-3 --limit 500
