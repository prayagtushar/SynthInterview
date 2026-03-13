# Question bank for SynthInterview.
# 3 difficulties, 5 topic categories.
# structured_tests: machine-runnable test cases.
# sort_compare: True if output order doesn't matter.

QUESTIONS = {
    "two-sum": {
        "id": "two-sum",
        "title": "Two Sum",
        "difficulty": "Easy",
        "topics": ["Arrays", "HashMaps"],
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
        "sort_compare": True,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(n)"
    },
    "valid-parentheses": {
        "id": "valid-parentheses",
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "topics": ["Strings", "Stacks"],
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
        "sort_compare": False,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(n)"
    },
    "reverse-linked-list": {
        "id": "reverse-linked-list",
        "title": "Reverse Linked List",
        "difficulty": "Easy",
        "topics": ["LinkedLists"],
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
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(1)"
    },
    "best-time-to-buy-stock": {
        "id": "best-time-to-buy-stock",
        "title": "Best Time to Buy and Sell Stock",
        "difficulty": "Easy",
        "topics": ["Arrays", "Sliding Window"],
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
        "sort_compare": False,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(1)"
    },
    "group-anagrams": {
        "id": "group-anagrams",
        "title": "Group Anagrams",
        "difficulty": "Medium",
        "topics": ["Strings", "HashMaps"],
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
        "sort_compare": "deep",
        "optimalTimeComplexity": "O(n * k log k) where k is max string length",
        "optimalSpaceComplexity": "O(n * k)"
    },
    "longest-substring-without-repeating": {
        "id": "longest-substring-without-repeating",
        "title": "Longest Substring Without Repeating Characters",
        "difficulty": "Medium",
        "topics": ["Strings", "Sliding Window", "HashMaps"],
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
        "sort_compare": False,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(min(n, m)) where m is charset size"
    },
    "binary-search": {
        "id": "binary-search",
        "title": "Binary Search",
        "difficulty": "Easy",
        "topics": ["Arrays", "Binary Search"],
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
        "sort_compare": False,
        "optimalTimeComplexity": "O(log n)",
        "optimalSpaceComplexity": "O(1)"
    },
    "coin-change": {
        "id": "coin-change",
        "title": "Coin Change",
        "difficulty": "Medium",
        "topics": ["DP"],
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
        "sort_compare": False,
        "optimalTimeComplexity": "O(amount * coins)",
        "optimalSpaceComplexity": "O(amount)"
    },
    "number-of-islands": {
        "id": "number-of-islands",
        "title": "Number of Islands",
        "difficulty": "Medium",
        "topics": ["Graphs"],
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
        "sort_compare": False,
        "optimalTimeComplexity": "O(m * n)",
        "optimalSpaceComplexity": "O(m * n)"
    },
    "climbing-stairs": {
        "id": "climbing-stairs",
        "title": "Climbing Stairs",
        "difficulty": "Easy",
        "topics": ["DP"],
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
        "sort_compare": False,
        "optimalTimeComplexity": "O(n)",
        "optimalSpaceComplexity": "O(1)"
    }
}

def get_question(question_id: str) -> dict:
    """Returns question by ID."""
    return QUESTIONS.get(question_id, QUESTIONS["two-sum"])

def select_question_for_session(difficulty: str, topics: list) -> dict:
    """Selects question based on difficulty and topics."""
    candidates = [q for q in QUESTIONS.values() if q["difficulty"] == difficulty]
    if topics and candidates:
        topic_matches = [q for q in candidates if any(t in q["topics"] for t in topics)]
        if topic_matches:
            candidates = topic_matches
    return candidates[0] if candidates else QUESTIONS["two-sum"]
