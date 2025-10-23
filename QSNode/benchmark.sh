#!/bin/bash

# QSN Performance Benchmark Script
# Tests transaction speed and finality time
# Goal: Prove <1 second median finality

echo "🚀 Quantum Settlement Node - Performance Benchmark"
echo "=================================================="
echo ""

API_URL="http://localhost:3000/api"
TEST_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
NUM_TRANSACTIONS=100

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Test Configuration:${NC}"
echo "  API URL: $API_URL"
echo "  Test Address: $TEST_ADDRESS"
echo "  Number of Transactions: $NUM_TRANSACTIONS"
echo ""

# Check if API is running
echo -e "${BLUE}Checking API health...${NC}"
HEALTH=$(curl -s "$API_URL/health")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API is healthy${NC}"
    echo "$HEALTH" | jq '.'
else
    echo -e "${YELLOW}❌ API is not responding${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Starting performance test...${NC}"
echo ""

# Array to store response times
declare -a TIMES

# Run transactions
for i in $(seq 1 $NUM_TRANSACTIONS); do
    START=$(date +%s%N)
    
    RESPONSE=$(curl -s -X POST "$API_URL/mint" \
        -H "Content-Type: application/json" \
        -d "{\"to\":\"$TEST_ADDRESS\",\"amount\":\"10\",\"currency\":\"USD\"}" \
        2>/dev/null)
    
    END=$(date +%s%N)
    DURATION=$(( ($END - $START) / 1000000 )) # Convert to milliseconds
    
    TIMES+=($DURATION)
    
    # Extract transaction hash if available
    TX_HASH=$(echo "$RESPONSE" | jq -r '.transactionHash // empty' 2>/dev/null)
    
    if [ ! -z "$TX_HASH" ]; then
        echo -e "${GREEN}✓${NC} Transaction $i: ${DURATION}ms (tx: ${TX_HASH:0:10}...)"
    else
        echo -e "${YELLOW}⚠${NC} Transaction $i: ${DURATION}ms (no tx hash)"
    fi
    
    # Small delay to avoid overwhelming the API
    sleep 0.01
done

echo ""
echo -e "${BLUE}Calculating statistics...${NC}"
echo ""

# Calculate statistics
TOTAL=0
MIN=${TIMES[0]}
MAX=${TIMES[0]}

for time in "${TIMES[@]}"; do
    TOTAL=$((TOTAL + time))
    if [ $time -lt $MIN ]; then
        MIN=$time
    fi
    if [ $time -gt $MAX ]; then
        MAX=$time
    fi
done

AVERAGE=$((TOTAL / ${#TIMES[@]}))

# Calculate median
IFS=$'\n' SORTED=($(sort -n <<<"${TIMES[*]}"))
unset IFS

MID=$((${#SORTED[@]} / 2))
if [ $((${#SORTED[@]} % 2)) -eq 0 ]; then
    MEDIAN=$(( (${SORTED[$MID-1]} + ${SORTED[$MID]}) / 2 ))
else
    MEDIAN=${SORTED[$MID]}
fi

# Calculate TPS
TOTAL_TIME_SEC=$(echo "scale=2; $TOTAL / 1000" | bc)
TPS=$(echo "scale=2; $NUM_TRANSACTIONS / $TOTAL_TIME_SEC" | bc)

# Display results
echo "=================================================="
echo -e "${GREEN}📊 Performance Results:${NC}"
echo "=================================================="
echo ""
echo "  Transactions: $NUM_TRANSACTIONS"
echo "  Total Time: ${TOTAL_TIME_SEC}s"
echo ""
echo -e "${BLUE}Latency:${NC}"
echo "  Min: ${MIN}ms"
echo "  Max: ${MAX}ms"
echo "  Average: ${AVERAGE}ms"
echo "  Median: ${MEDIAN}ms"
echo ""
echo -e "${BLUE}Throughput:${NC}"
echo "  TPS: ${TPS} transactions/second"
echo ""

# Check if median is under 1 second
if [ $MEDIAN -lt 1000 ]; then
    echo -e "${GREEN}✅ SUCCESS: Median finality (${MEDIAN}ms) is under 1 second!${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: Median finality (${MEDIAN}ms) exceeds 1 second${NC}"
fi

echo ""
echo "=================================================="

# Get final balance
echo ""
echo -e "${BLUE}Checking final balance...${NC}"
BALANCE=$(curl -s "$API_URL/balance/$TEST_ADDRESS" | jq -r '.balance')
echo -e "${GREEN}Final Balance: $BALANCE USDx${NC}"

echo ""
echo "🎉 Performance benchmark complete!"
