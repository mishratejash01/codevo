-- Insert sample assignments
INSERT INTO public.assignments (id, title, description, instructions, deadline, max_score, category) VALUES
('a1111111-1111-1111-1111-111111111111', 'GrPA 5 - min, max, sorted, groupby - GRADED', 
'Create a class Time with the following specification

Attributes
time: int, represents time in seconds

Methods
(1) __init__: accept time in seconds as an argument and assign it to the corresponding attribute
(2) seconds_to_minutes: convert the value of time into minutes and return a string in the format: "<minutes> min <seconds> sec". For example, if the value of the attribute time is 170, this method should return the string "2 min 50 sec"
(3) seconds_to_hours: convert the value of time into hours and return a string in the format: "<hours> hrs <minutes> min <seconds> sec". For example, if the value of the attribute time is 10800, this method should return the string "3 hrs 1 min 30 sec"
(4) seconds_to_days: convert the value of time into days and return a string in the format: "<days> days <hours> hrs <minutes> min <seconds> sec". For example, if the value of the attribute time is 86400, this method should return the string "1 days 0 hrs 1 min 0 sec"

(1) Each test case corresponds to one or more method calls. We will use T to denote the name of the object.
(2) You do not have to accept input from the user or print output to the console. You just have to define the class based on the specifications given in the question.',
'Use "Test Run" to verify your code with public test cases.
Press "Submit" to have your assignment evaluated.
You can submit your assignment multiple times up until the deadline.
Make sure to submit your final code by the deadline to receive your score.',
'2025-12-31 23:59:00+00', 100, '2024 Sep Oppe 1'),

('a2222222-2222-2222-2222-222222222222', 'GrPA 4 - List Operations', 
'Write a function process_list(data: list) that takes a list of integers and returns:
- The sum of all even numbers
- The product of all odd numbers
- A list of all prime numbers in the input

Return these three values as a tuple: (sum_even, product_odd, primes_list)',
'Use "Test Run" to verify your code with public test cases.
Press "Submit" to have your assignment evaluated.
You can submit your assignment multiple times up until the deadline.
Make sure to submit your final code by the deadline to receive your score.',
'2025-12-03 23:59:00+00', 100, '2024 Sep Oppe 1'),

('a3333333-3333-3333-3333-333333333333', 'String Manipulation - Practice', 
'Write a function reverse_words(sentence: str) that takes a sentence and returns a new sentence where each word is reversed, but the word order remains the same.

Example: "Hello World" -> "olleH dlroW"',
'Use "Test Run" to verify your code with public test cases.
Press "Submit" to have your assignment evaluated.',
'2025-12-15 23:59:00+00', 100, '2024 Sep Oppe 1');

-- Insert test cases for GrPA 5 (Time class)
INSERT INTO public.test_cases (assignment_id, input, expected_output, is_public, weight) VALUES
('a1111111-1111-1111-1111-111111111111', 'public
Time(35)', '0 min 35 sec
0 hrs 0 min 35 sec
0 days 0 hrs 0 min 35 sec', true, 1),
('a1111111-1111-1111-1111-111111111111', 'public
Time(170)', '2 min 50 sec
0 hrs 2 min 50 sec
0 days 0 hrs 2 min 50 sec', true, 1),
('a1111111-1111-1111-1111-111111111111', 'public
Time(10830)', '180 min 30 sec
3 hrs 0 min 30 sec
0 days 3 hrs 0 min 30 sec', true, 1),
('a1111111-1111-1111-1111-111111111111', 'private
Time(86435)', '1440 min 35 sec
24 hrs 0 min 35 sec
1 days 0 hrs 0 min 35 sec', false, 1),
('a1111111-1111-1111-1111-111111111111', 'private
Time(90061)', '1501 min 1 sec
25 hrs 1 min 1 sec
1 days 1 hrs 1 min 1 sec', false, 1);

-- Insert test cases for GrPA 4 (List Operations)
INSERT INTO public.test_cases (assignment_id, input, expected_output, is_public, weight) VALUES
('a2222222-2222-2222-2222-222222222222', '[2, 3, 4, 5, 6]', '(12, 15, [2, 3, 5])', true, 1),
('a2222222-2222-2222-2222-222222222222', '[1, 2, 3, 4]', '(6, 3, [2, 3])', true, 1),
('a2222222-2222-2222-2222-222222222222', '[10, 15, 20, 25]', '(30, 375, [])', false, 1),
('a2222222-2222-2222-2222-222222222222', '[7, 11, 13, 17]', '(0, 17017, [7, 11, 13, 17])', false, 1);

-- Insert test cases for String Manipulation
INSERT INTO public.test_cases (assignment_id, input, expected_output, is_public, weight) VALUES
('a3333333-3333-3333-3333-333333333333', 'Hello World', 'olleH dlroW', true, 1),
('a3333333-3333-3333-3333-333333333333', 'Python Programming', 'nohtyP gnimmargorP', true, 1),
('a3333333-3333-3333-3333-333333333333', 'The quick brown fox', 'ehT kciuq kciuq nworb xof', false, 1),
('a3333333-3333-3333-3333-333333333333', 'Data Structures', 'ataD serutcurtS', false, 1);