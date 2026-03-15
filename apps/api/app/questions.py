# Question bank for SynthInterview.
# 3 difficulties, multiple DSA topic categories.
# structured_tests: machine-runnable test cases.
# sort_compare: True if output order doesn't matter.
# pattern: the algorithmic pattern this problem exemplifies.

QUESTIONS = {
    "two-sum": {
        "id": "two-sum",
        "title": "Two Sum",
        "difficulty": "Easy",
        "topics": ["Arrays", "HashMap"],
        "pattern": "Hash Map",
        "function_name": "twoSum",
        "description": """Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

**Example 1:**
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] == 9, so return [0, 1].

**Example 2:**
Input: nums = [3, 2, 4], target = 6
Output: [1, 2]

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- Only one valid answer exists.""",
        "hints": [
            "Think about what complement you need for each number to reach the target.",
            "A HashMap can store values you've already seen and their indices for O(1) lookup.",
            "For each number nums[i], check if target - nums[i] is already in your HashMap."
        ],
        "testCases": [
            {"input": "[2,7,11,15], target=9", "output": "[0,1]"},
            {"input": "[3,2,4], target=6", "output": "[1,2]"},
            {"input": "[3,3], target=6", "output": "[0,1]"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": [[2, 7, 11, 15], 9],  "expected": [0, 1]},
            {"label": "TC2", "args": [[3, 2, 4],       6],  "expected": [1, 2]},
            {"label": "TC3", "args": [[3, 3],           6],  "expected": [0, 1]},
            {"label": "TC4 (hidden)", "args": [[1, 5, 3, 2], 4], "expected": [2, 3]},
            {"label": "TC5 (hidden)", "args": [[-1, -2, -3, -4, -5], -8], "expected": [2, 4]},
        ],
        "starterCode": {
            "javascript": "function twoSum(nums, target) {\n  // Write your solution...\n}\n",
            "typescript": "function twoSum(nums: number[], target: number): number[] {\n  // Write your solution...\n}\n",
            "python": "def twoSum(nums, target):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc twoSum(nums []int, target int) []int {\n\t// Write your solution...\n\treturn nil\n}\n",
        },
        "sort_compare": True,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(n)"
    },
    "valid-parentheses": {
        "id": "valid-parentheses",
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "topics": ["Strings", "Stack"],
        "pattern": "Stack",
        "function_name": "isValid",
        "description": """Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
- Open brackets must be closed by the same type of brackets.
- Open brackets must be closed in the correct order.
- Every close bracket has a corresponding open bracket of the same type.

**Example 1:**
Input: s = "()"
Output: true

**Example 2:**
Input: s = "()[]{}"
Output: true

**Example 3:**
Input: s = "(]"
Output: false""",
        "hints": [
            "Think about what data structure naturally handles 'last in, first out' ordering.",
            "A stack is perfect — push open brackets, pop when you see a closing bracket.",
            "Check if the popped character matches the expected opening bracket."
        ],
        "testCases": [
            {"input": "\"()\"", "output": "true"},
            {"input": "\"()[]{}\"", "output": "true"},
            {"input": "\"(]\"", "output": "false"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": ["()"],       "expected": True},
            {"label": "TC2", "args": ["()[]{}"],   "expected": True},
            {"label": "TC3", "args": ["(]"],        "expected": False},
            {"label": "TC4 (hidden)", "args": ["{[]}"],     "expected": True},
            {"label": "TC5 (hidden)", "args": ["([)]"],     "expected": False},
            {"label": "TC6 (hidden)", "args": [""],         "expected": True},
        ],
        "starterCode": {
            "javascript": "function isValid(s) {\n  // Write your solution...\n}\n",
            "typescript": "function isValid(s: string): boolean {\n  // Write your solution...\n}\n",
            "python": "def isValid(s):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <string>\nusing namespace std;\n\nbool isValid(string s) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public boolean isValid(String s) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc isValid(s string) bool {\n\t// Write your solution...\n\treturn false\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(n)"
    },
    "reverse-linked-list": {
        "id": "reverse-linked-list",
        "title": "Reverse Linked List",
        "difficulty": "Easy",
        "topics": ["LinkedList"],
        "pattern": "Iterative Pointer Reversal",
        "function_name": "reverseList",
        "description": """Given the `head` of a singly linked list, reverse the list, and return the reversed list.

**Example 1:**
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]

**Example 2:**
Input: head = [1,2]
Output: [2,1]

**Example 3:**
Input: head = []
Output: []""",
        "hints": [
            "You need to change the direction of each node's next pointer.",
            "Keep track of the previous node as you traverse.",
            "Three pointers: prev, curr, next — update them one by one."
        ],
        "testCases": [
            {"input": "[1,2,3,4,5]", "output": "[5,4,3,2,1]"},
            {"input": "[1,2]", "output": "[2,1]"},
            {"input": "[]", "output": "[]"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": [[1,2,3,4,5]], "expected": [5,4,3,2,1]},
            {"label": "TC2", "args": [[1,2]], "expected": [2,1]},
            {"label": "TC3", "args": [[]], "expected": []},
            {"label": "TC4 (hidden)", "args": [[9,8,7]], "expected": [7,8,9]},
        ],
        "starterCode": {
            "javascript": "function reverseList(head) {\n  // Write your solution...\n}\n",
            "typescript": "function reverseList(head: ListNode | null): ListNode | null {\n  // Write your solution...\n}\n",
            "python": "def reverseList(head):\n    # Write your solution...\n    pass\n",
            "cpp": "struct ListNode { int val; ListNode *next; };\n\nListNode* reverseList(ListNode* head) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc reverseList(head *ListNode) *ListNode {\n\t// Write your solution...\n\treturn nil\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(1)"
    },
    "best-time-to-buy-stock": {
        "id": "best-time-to-buy-stock",
        "title": "Best Time to Buy and Sell Stock",
        "difficulty": "Easy",
        "topics": ["Arrays", "Sliding Window"],
        "pattern": "Sliding Window / Greedy",
        "function_name": "maxProfit",
        "description": """You are given an array `prices` where `prices[i]` is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

**Example 1:**
Input: prices = [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.

**Example 2:**
Input: prices = [7,6,4,3,1]
Output: 0
Explanation: No profit is possible.""",
        "hints": [
            "You only need one pass — track the minimum price seen so far.",
            "At each day, compute the profit if you sold today: price - min_price.",
            "Track the maximum profit as you go."
        ],
        "testCases": [
            {"input": "[7,1,5,3,6,4]", "output": "5"},
            {"input": "[7,6,4,3,1]", "output": "0"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": [[7, 1, 5, 3, 6, 4]], "expected": 5},
            {"label": "TC2", "args": [[7, 6, 4, 3, 1]],    "expected": 0},
            {"label": "TC3 (hidden)", "args": [[1, 2]],             "expected": 1},
            {"label": "TC4 (hidden)", "args": [[2, 4, 1]],          "expected": 2},
            {"label": "TC5 (hidden)", "args": [[3, 3]],             "expected": 0},
        ],
        "starterCode": {
            "javascript": "function maxProfit(prices) {\n  // Write your solution...\n}\n",
            "typescript": "function maxProfit(prices: number[]): number {\n  // Write your solution...\n}\n",
            "python": "def maxProfit(prices):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <vector>\nusing namespace std;\n\nint maxProfit(vector<int>& prices) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public int maxProfit(int[] prices) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc maxProfit(prices []int) int {\n\t// Write your solution...\n\treturn 0\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(1)"
    },
    "binary-search": {
        "id": "binary-search",
        "title": "Binary Search",
        "difficulty": "Easy",
        "topics": ["Arrays", "Binary Search"],
        "pattern": "Binary Search",
        "function_name": "search",
        "description": """Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

**Example 1:**
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4

**Example 2:**
Input: nums = [-1,0,3,5,9,12], target = 2
Output: -1""",
        "hints": [
            "Narrow down the search space by half each time using mid point.",
            "Compare nums[mid] to target — go left or right accordingly.",
            "Be careful with the boundary conditions for left and right pointers."
        ],
        "testCases": [
            {"input": "[-1,0,3,5,9,12], target=9", "output": "4"},
            {"input": "[-1,0,3,5,9,12], target=2", "output": "-1"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": [[-1, 0, 3, 5, 9, 12], 9],  "expected": 4},
            {"label": "TC2", "args": [[-1, 0, 3, 5, 9, 12], 2],  "expected": -1},
            {"label": "TC3 (hidden)", "args": [[5], 5],                   "expected": 0},
            {"label": "TC4 (hidden)", "args": [[1, 2, 3, 4, 5], 3],       "expected": 2},
            {"label": "TC5 (hidden)", "args": [[1, 2, 3, 4, 5], 6],       "expected": -1},
        ],
        "starterCode": {
            "javascript": "function search(nums, target) {\n  // Write your solution...\n}\n",
            "typescript": "function search(nums: number[], target: number): number {\n  // Write your solution...\n}\n",
            "python": "def search(nums, target):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <vector>\nusing namespace std;\n\nint search(vector<int>& nums, int target) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public int search(int[] nums, int target) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc search(nums []int, target int) int {\n\t// Write your solution...\n\treturn -1\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(log n)",
        "optimalSpaceComplexity": "O(1)"
    },
    "climbing-stairs": {
        "id": "climbing-stairs",
        "title": "Climbing Stairs",
        "difficulty": "Easy",
        "topics": ["DP"],
        "pattern": "Dynamic Programming (Fibonacci)",
        "function_name": "climbStairs",
        "description": """You are climbing a staircase. It takes `n` steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

**Example 1:**
Input: n = 2
Output: 2
Explanation: There are two ways to climb to the top: 1+1, 2.

**Example 2:**
Input: n = 3
Output: 3
Explanation: There are three ways: 1+1+1, 1+2, 2+1.""",
        "hints": [
            "Think about the last step — you either came from step n-1 or n-2.",
            "This is actually the Fibonacci sequence.",
            "dp[i] = dp[i-1] + dp[i-2] with dp[1]=1, dp[2]=2."
        ],
        "testCases": [
            {"input": "n=2", "output": "2"},
            {"input": "n=3", "output": "3"},
            {"input": "n=5", "output": "8"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": [2],  "expected": 2},
            {"label": "TC2", "args": [3],  "expected": 3},
            {"label": "TC3", "args": [5],  "expected": 8},
            {"label": "TC4 (hidden)", "args": [1],  "expected": 1},
            {"label": "TC5 (hidden)", "args": [10], "expected": 89},
        ],
        "starterCode": {
            "javascript": "function climbStairs(n) {\n  // Write your solution...\n}\n",
            "typescript": "function climbStairs(n: number): number {\n  // Write your solution...\n}\n",
            "python": "def climbStairs(n):\n    # Write your solution...\n    pass\n",
            "cpp": "int climbStairs(int n) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public int climbStairs(int n) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc climbStairs(n int) int {\n\t// Write your solution...\n\treturn 0\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(1)"
    },
    # ── Medium ───────────────────────────────────────────────────────────────
    "group-anagrams": {
        "id": "group-anagrams",
        "title": "Group Anagrams",
        "difficulty": "Medium",
        "topics": ["Strings", "HashMap"],
        "pattern": "Hash Map with Sorted Key",
        "function_name": "groupAnagrams",
        "description": """Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

**Example 1:**
Input: strs = ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]

**Example 2:**
Input: strs = [""]
Output: [[""]]

**Constraints:**
- 1 <= strs.length <= 10^4
- 0 <= strs[i].length <= 100
- strs[i] consists of lowercase English letters.""",
        "hints": [
            "Anagrams contain the same characters — find a canonical form to group them.",
            "Sorting each string gives the same key for all anagrams in a group.",
            "Use a HashMap with sorted_string as key and list of original strings as value."
        ],
        "testCases": [
            {"input": "[\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", "output": "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]"},
        ],
        "structured_tests": [
            {"label": "TC1", "args": [["eat","tea","tan","ate","nat","bat"]], "expected": [["bat"],["nat","tan"],["ate","eat","tea"]]},
            {"label": "TC2", "args": [[""]], "expected": [[""]]},
            {"label": "TC3", "args": [["a"]], "expected": [["a"]]},
            {"label": "TC4 (hidden)", "args": [["cab","tin","pew","duh","may","ill","buy","bar","max","doc"]], "expected": [["doc"],["bar"],["buy"],["ill"],["may"],["tin"],["cab"],["pew"],["max"],["duh"]]}
        ],
        "starterCode": {
            "javascript": "function groupAnagrams(strs) {\n  // Write your solution...\n}\n",
            "typescript": "function groupAnagrams(strs: string[]): string[][] {\n  // Write your solution...\n}\n",
            "python": "def groupAnagrams(strs):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <vector>\n#include <string>\nusing namespace std;\n\nvector<vector<string>> groupAnagrams(vector<string>& strs) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc groupAnagrams(strs []string) [][]string {\n\t// Write your solution...\n\treturn nil\n}\n",
        },
        "sort_compare": "deep",
        "optimalTimeComplexity": "O(n * k log k) where k is max string length",
        "optimalSpaceComplexity": "O(n * k)"
    },
    "longest-substring-without-repeating": {
        "id": "longest-substring-without-repeating",
        "title": "Longest Substring Without Repeating Characters",
        "difficulty": "Medium",
        "topics": ["Strings", "Sliding Window", "HashMap"],
        "pattern": "Sliding Window",
        "function_name": "lengthOfLongestSubstring",
        "description": """Given a string `s`, find the length of the longest substring without repeating characters.

**Example 1:**
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.

**Example 2:**
Input: s = "bbbbb"
Output: 1

**Example 3:**
Input: s = "pwwkew"
Output: 3""",
        "hints": [
            "Use a sliding window to track the current substring.",
            "A HashSet or HashMap tells you quickly if a character is already in your window.",
            "When a duplicate is found, shrink the window from the left until it's gone."
        ],
        "testCases": [
            {"input": "\"abcabcbb\"", "output": "3"},
            {"input": "\"bbbbb\"", "output": "1"},
            {"input": "\"pwwkew\"", "output": "3"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": ["abcabcbb"], "expected": 3},
            {"label": "TC2", "args": ["bbbbb"],    "expected": 1},
            {"label": "TC3", "args": ["pwwkew"],   "expected": 3},
            {"label": "TC4 (hidden)", "args": [""],        "expected": 0},
            {"label": "TC5 (hidden)", "args": ["au"],      "expected": 2},
            {"label": "TC6 (hidden)", "args": ["dvdf"],    "expected": 3},
        ],
        "starterCode": {
            "javascript": "function lengthOfLongestSubstring(s) {\n  // Write your solution...\n}\n",
            "typescript": "function lengthOfLongestSubstring(s: string): number {\n  // Write your solution...\n}\n",
            "python": "def lengthOfLongestSubstring(s):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <string>\nusing namespace std;\n\nint lengthOfLongestSubstring(string s) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc lengthOfLongestSubstring(s string) int {\n\t// Write your solution...\n\treturn 0\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(min(n, m)) where m is charset size"
    },
    "coin-change": {
        "id": "coin-change",
        "title": "Coin Change",
        "difficulty": "Medium",
        "topics": ["DP"],
        "pattern": "Dynamic Programming (Bottom-Up)",
        "function_name": "coinChange",
        "description": """You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.

You may assume that you have an infinite number of each kind of coin.

**Example 1:**
Input: coins = [1,5,11], amount = 11
Output: 1

**Example 2:**
Input: coins = [2], amount = 3
Output: -1""",
        "hints": [
            "This is a classic dynamic programming problem — think in terms of subproblems.",
            "dp[i] = minimum coins to make amount i. Build it up from 0 to amount.",
            "For each amount i, try every coin: dp[i] = min(dp[i], dp[i - coin] + 1)."
        ],
        "testCases": [
            {"input": "coins=[1,5,11], amount=11", "output": "1"},
            {"input": "coins=[2], amount=3", "output": "-1"},
            {"input": "coins=[1,2,5], amount=11", "output": "3"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": [[1, 5, 11], 11],  "expected": 1},
            {"label": "TC2", "args": [[2], 3],          "expected": -1},
            {"label": "TC3", "args": [[1, 2, 5], 11],   "expected": 3},
            {"label": "TC4 (hidden)", "args": [[1], 0],         "expected": 0},
            {"label": "TC5 (hidden)", "args": [[2, 5, 10, 1], 27], "expected": 4},
        ],
        "starterCode": {
            "javascript": "function coinChange(coins, amount) {\n  // Write your solution...\n}\n",
            "typescript": "function coinChange(coins: number[], amount: number): number {\n  // Write your solution...\n}\n",
            "python": "def coinChange(coins, amount):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <vector>\nusing namespace std;\n\nint coinChange(vector<int>& coins, int amount) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc coinChange(coins []int, amount int) int {\n\t// Write your solution...\n\treturn -1\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(amount * coins)",
        "optimalSpaceComplexity": "O(amount)"
    },
    "number-of-islands": {
        "id": "number-of-islands",
        "title": "Number of Islands",
        "difficulty": "Medium",
        "topics": ["Graphs"],
        "pattern": "DFS / BFS Graph Traversal",
        "function_name": "numIslands",
        "description": """Given an m x n 2D binary grid `grid` which represents a map of '1's (land) and '0's (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

**Example 1:**
Input: grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
Output: 1

**Example 2:**
Input: grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]
Output: 3""",
        "hints": [
            "Use DFS or BFS to explore and 'sink' each island when found.",
            "Start DFS from each unvisited '1', marking connected cells as visited.",
            "Count how many times you start a new DFS — that's the island count."
        ],
        "testCases": [
            {"input": "grid with 1 connected component", "output": "1"},
            {"input": "grid with 3 disconnected components", "output": "3"}
        ],
        "structured_tests": [
            {
                "label": "TC1",
                "args": [[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]],
                "expected": 1
            },
            {
                "label": "TC2",
                "args": [[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]],
                "expected": 3
            },
            {
                "label": "TC3 (hidden)",
                "args": [[["1"]]],
                "expected": 1
            },
            {
                "label": "TC4 (hidden)",
                "args": [[["0"]]],
                "expected": 0
            },
        ],
        "starterCode": {
            "javascript": "function numIslands(grid) {\n  // Write your solution...\n}\n",
            "typescript": "function numIslands(grid: string[][]): number {\n  // Write your solution...\n}\n",
            "python": "def numIslands(grid):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <vector>\n#include <string>\nusing namespace std;\n\nint numIslands(vector<vector<char>>& grid) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public int numIslands(char[][] grid) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc numIslands(grid [][]byte) int {\n\t// Write your solution...\n\treturn 0\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(m * n)",
        "optimalSpaceComplexity": "O(m * n)"
    },
    "container-with-most-water": {
        "id": "container-with-most-water",
        "title": "Container With Most Water",
        "difficulty": "Medium",
        "topics": ["Arrays", "Two Pointers"],
        "pattern": "Two Pointers",
        "function_name": "maxArea",
        "description": """You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

**Example 1:**
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The vertical lines at index 1 and 8 (heights 8 and 7) form the container with area = min(8,7) * (8-1) = 49.

**Example 2:**
Input: height = [1,1]
Output: 1

**Constraints:**
- n == height.length
- 2 <= n <= 10^5
- 0 <= height[i] <= 10^4""",
        "hints": [
            "Start with the widest possible container (left pointer at 0, right pointer at end).",
            "The area is limited by the shorter line — moving the taller pointer inward can only decrease width without guarantee of height increase.",
            "Always move the pointer pointing to the shorter line inward to potentially find a taller line."
        ],
        "testCases": [
            {"input": "[1,8,6,2,5,4,8,3,7]", "output": "49"},
            {"input": "[1,1]", "output": "1"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": [[1,8,6,2,5,4,8,3,7]], "expected": 49},
            {"label": "TC2", "args": [[1,1]],                "expected": 1},
            {"label": "TC3 (hidden)", "args": [[4,3,2,1,4]], "expected": 16},
            {"label": "TC4 (hidden)", "args": [[1,2,1]],     "expected": 2},
        ],
        "starterCode": {
            "javascript": "function maxArea(height) {\n  // Write your solution...\n}\n",
            "typescript": "function maxArea(height: number[]): number {\n  // Write your solution...\n}\n",
            "python": "def maxArea(height):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <vector>\nusing namespace std;\n\nint maxArea(vector<int>& height) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public int maxArea(int[] height) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc maxArea(height []int) int {\n\t// Write your solution...\n\treturn 0\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(1)"
    },
    "find-minimum-in-rotated-sorted-array": {
        "id": "find-minimum-in-rotated-sorted-array",
        "title": "Find Minimum in Rotated Sorted Array",
        "difficulty": "Medium",
        "topics": ["Arrays", "Binary Search"],
        "pattern": "Binary Search on Rotated Array",
        "function_name": "findMin",
        "description": """Suppose an array of length `n` sorted in ascending order is rotated between 1 and n times.

Given the sorted rotated array `nums` of unique elements, return the minimum element of this array.

You must write an algorithm that runs in O(log n) time.

**Example 1:**
Input: nums = [3,4,5,1,2]
Output: 1
Explanation: The original array was [1,2,3,4,5] rotated 3 times.

**Example 2:**
Input: nums = [4,5,6,7,0,1,2]
Output: 0

**Example 3:**
Input: nums = [11,13,15,17]
Output: 11

**Constraints:**
- n == nums.length
- 1 <= n <= 5000
- -5000 <= nums[i] <= 5000
- All the integers of nums are unique.""",
        "hints": [
            "You can't use a standard binary search since the array isn't fully sorted — but part of it always is.",
            "Compare nums[mid] with nums[right]: if nums[mid] > nums[right], the minimum is in the right half.",
            "If nums[mid] <= nums[right], the minimum is in the left half (including mid)."
        ],
        "testCases": [
            {"input": "[3,4,5,1,2]", "output": "1"},
            {"input": "[4,5,6,7,0,1,2]", "output": "0"},
            {"input": "[11,13,15,17]", "output": "11"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": [[3,4,5,1,2]],       "expected": 1},
            {"label": "TC2", "args": [[4,5,6,7,0,1,2]],   "expected": 0},
            {"label": "TC3", "args": [[11,13,15,17]],      "expected": 11},
            {"label": "TC4 (hidden)", "args": [[1]],        "expected": 1},
            {"label": "TC5 (hidden)", "args": [[2,1]],      "expected": 1},
        ],
        "starterCode": {
            "javascript": "function findMin(nums) {\n  // Write your solution...\n}\n",
            "typescript": "function findMin(nums: number[]): number {\n  // Write your solution...\n}\n",
            "python": "def findMin(nums):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <vector>\nusing namespace std;\n\nint findMin(vector<int>& nums) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public int findMin(int[] nums) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc findMin(nums []int) int {\n\t// Write your solution...\n\treturn 0\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(log n)",
        "optimalSpaceComplexity": "O(1)"
    },
    # ── Hard ─────────────────────────────────────────────────────────────────
    "trapping-rain-water": {
        "id": "trapping-rain-water",
        "title": "Trapping Rain Water",
        "difficulty": "Hard",
        "topics": ["Arrays", "Two Pointers", "Stack"],
        "pattern": "Two Pointers",
        "function_name": "trap",
        "description": """Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

**Example 1:**
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
Explanation: The elevation map traps 6 units of water.

**Example 2:**
Input: height = [4,2,0,3,2,5]
Output: 9

**Constraints:**
- n == height.length
- 1 <= n <= 2 * 10^4
- 0 <= height[i] <= 10^5""",
        "hints": [
            "For each position, water trapped = min(max_left, max_right) - height[i]. Think about how to compute max_left and max_right efficiently.",
            "A brute-force approach computes max_left and max_right for every index in O(n^2). Can you precompute them in O(n)?",
            "The two-pointer approach: use left and right pointers. At each step, process the side with the smaller height — water trapped there is bounded by that height."
        ],
        "testCases": [
            {"input": "[0,1,0,2,1,0,1,3,2,1,2,1]", "output": "6"},
            {"input": "[4,2,0,3,2,5]", "output": "9"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": [[0,1,0,2,1,0,1,3,2,1,2,1]], "expected": 6},
            {"label": "TC2", "args": [[4,2,0,3,2,5]],              "expected": 9},
            {"label": "TC3 (hidden)", "args": [[3,0,2,0,4]],        "expected": 7},
            {"label": "TC4 (hidden)", "args": [[1,0,1]],             "expected": 1},
            {"label": "TC5 (hidden)", "args": [[0,0,0]],             "expected": 0},
        ],
        "starterCode": {
            "javascript": "function trap(height) {\n  // Write your solution...\n}\n",
            "typescript": "function trap(height: number[]): number {\n  // Write your solution...\n}\n",
            "python": "def trap(height):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <vector>\nusing namespace std;\n\nint trap(vector<int>& height) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public int trap(int[] height) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc trap(height []int) int {\n\t// Write your solution...\n\treturn 0\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(1)"
    },
    "word-break": {
        "id": "word-break",
        "title": "Word Break",
        "difficulty": "Hard",
        "topics": ["DP", "Strings"],
        "pattern": "Dynamic Programming",
        "function_name": "wordBreak",
        "description": """Given a string `s` and a dictionary of strings `wordDict`, return `true` if `s` can be segmented into a space-separated sequence of one or more dictionary words.

Note that the same word in the dictionary may be reused multiple times in the segmentation.

**Example 1:**
Input: s = "leetcode", wordDict = ["leet","code"]
Output: true
Explanation: "leetcode" can be segmented as "leet code".

**Example 2:**
Input: s = "applepenapple", wordDict = ["apple","pen"]
Output: true
Explanation: "applepenapple" can be segmented as "apple pen apple".

**Example 3:**
Input: s = "catsandog", wordDict = ["cats","dog","sand","and","cat"]
Output: false

**Constraints:**
- 1 <= s.length <= 300
- 1 <= wordDict.length <= 1000
- 1 <= wordDict[i].length <= 20
- s and wordDict[i] consist of only lowercase English letters.""",
        "hints": [
            "Think about this as: can we partition s[0..i] into valid words for each i?",
            "dp[i] = True if s[0:i] can be segmented. dp[0] = True (empty string).",
            "For each position i, check all j < i: if dp[j] is True AND s[j:i] is in wordDict, then dp[i] = True."
        ],
        "testCases": [
            {"input": "s=\"leetcode\", wordDict=[\"leet\",\"code\"]", "output": "true"},
            {"input": "s=\"applepenapple\", wordDict=[\"apple\",\"pen\"]", "output": "true"},
            {"input": "s=\"catsandog\", wordDict=[\"cats\",\"dog\",\"sand\",\"and\",\"cat\"]", "output": "false"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": ["leetcode", ["leet","code"]],                          "expected": True},
            {"label": "TC2", "args": ["applepenapple", ["apple","pen"]],                     "expected": True},
            {"label": "TC3", "args": ["catsandog", ["cats","dog","sand","and","cat"]],        "expected": False},
            {"label": "TC4 (hidden)", "args": ["a", ["a"]],                                  "expected": True},
            {"label": "TC5 (hidden)", "args": ["aaaaaaa", ["aaaa","aaa"]],                   "expected": True},
        ],
        "starterCode": {
            "javascript": "function wordBreak(s, wordDict) {\n  // Write your solution...\n}\n",
            "typescript": "function wordBreak(s: string, wordDict: string[]): boolean {\n  // Write your solution...\n}\n",
            "python": "def wordBreak(s, wordDict):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <string>\n#include <vector>\nusing namespace std;\n\nbool wordBreak(string s, vector<string>& wordDict) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public boolean wordBreak(String s, List<String> wordDict) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc wordBreak(s string, wordDict []string) bool {\n\t// Write your solution...\n\treturn false\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(n^2)",
        "optimalSpaceComplexity": "O(n)"
    },
    "longest-valid-parentheses": {
        "id": "longest-valid-parentheses",
        "title": "Longest Valid Parentheses",
        "difficulty": "Hard",
        "topics": ["Strings", "Stack", "DP"],
        "pattern": "Stack / Dynamic Programming",
        "function_name": "longestValidParentheses",
        "description": """Given a string containing just the characters '(' and ')', return the length of the longest valid (well-formed) parentheses substring.

**Example 1:**
Input: s = "(()"
Output: 2
Explanation: The longest valid parentheses substring is "()".

**Example 2:**
Input: s = ")()())"
Output: 4
Explanation: The longest valid parentheses substring is "()()".

**Example 3:**
Input: s = ""
Output: 0

**Constraints:**
- 0 <= s.length <= 3 * 10^4
- s[i] is '(' or ')'""",
        "hints": [
            "A stack-based approach: push the index of '(' onto the stack. When you see ')', pop from the stack. If the stack is empty, push the current index as a 'base'. Length = current_index - stack_top.",
            "A DP approach: dp[i] = length of longest valid substring ending at i. If s[i] == ')', look at s[i-1]: if it's '(', dp[i] = dp[i-2] + 2. If it's ')', look further back.",
            "A two-pass approach: scan left-to-right tracking open/close counts; when equal, update max. Then scan right-to-left for the symmetric case."
        ],
        "testCases": [
            {"input": "\"(()\"", "output": "2"},
            {"input": "\")()())\"", "output": "4"},
            {"input": "\"\"", "output": "0"}
        ],
        "structured_tests": [
            {"label": "TC1", "args": ["(()"],    "expected": 2},
            {"label": "TC2", "args": [")()())"], "expected": 4},
            {"label": "TC3", "args": [""],       "expected": 0},
            {"label": "TC4 (hidden)", "args": ["()((()))"], "expected": 8},
            {"label": "TC5 (hidden)", "args": ["()(()"],    "expected": 4},
        ],
        "starterCode": {
            "javascript": "function longestValidParentheses(s) {\n  // Write your solution...\n}\n",
            "typescript": "function longestValidParentheses(s: string): number {\n  // Write your solution...\n}\n",
            "python": "def longestValidParentheses(s):\n    # Write your solution...\n    pass\n",
            "cpp": "#include <string>\nusing namespace std;\n\nint longestValidParentheses(string s) {\n    // Write your solution...\n}\n",
            "java": "class Solution {\n    public int longestValidParentheses(String s) {\n        // Write your solution...\n    }\n}\n",
            "go": "package main\n\nfunc longestValidParentheses(s string) int {\n\t// Write your solution...\n\treturn 0\n}\n",
        },
        "sort_compare": False,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(n) for stack/DP, O(1) for two-pass"
    },
}


def get_question(question_id: str) -> dict:
    """Returns question by ID."""
    return QUESTIONS.get(question_id, QUESTIONS["two-sum"])


# Number of questions to select per difficulty
QUESTION_COUNTS = {"Easy": 3, "Medium": 2, "Hard": 1}


def select_questions_for_session(difficulty: str, topics: list) -> list:
    """Selects a list of N unique questions filtered by difficulty and optionally topics."""
    import random
    n = QUESTION_COUNTS.get(difficulty, 2)
    candidates = [q for q in QUESTIONS.values() if q["difficulty"] == difficulty]

    if topics and candidates:
        topic_matches = [q for q in candidates if any(t in q["topics"] for t in topics)]
        if len(topic_matches) >= n:
            # Enough topic-matched questions — use only those
            candidates = topic_matches
        elif topic_matches:
            # Not enough topic matches — prioritize them, fill remainder from others
            remainder = [q for q in candidates if q not in topic_matches]
            random.shuffle(remainder)
            candidates = topic_matches + remainder

    random.shuffle(candidates)
    selected = candidates[:n]

    # Fallback: if bank is too small, repeat (shouldn't happen in practice)
    if len(selected) < n and candidates:
        selected = (candidates * n)[:n]

    return selected


# Keep old function for backward compatibility with any direct callers
def select_question_for_session(difficulty: str, topics: list) -> dict:
    """Legacy single-question selector. Use select_questions_for_session instead."""
    results = select_questions_for_session(difficulty, topics)
    return results[0] if results else QUESTIONS["two-sum"]
