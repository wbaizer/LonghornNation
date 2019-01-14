import json
import praw
import time
from collections import deque
from file_read_backwards import FileReadBackwards
import pprint

SUBREDDIT = "LonghornNation"
subreddit_parse_limit = 20
MIN_SCORE = 10
SEARCH_BACK_DAYS = 3
DAY_IN_SECS = 86400
SCRAPED_POSTS_FILE = "scraped.txt"
REDDIT_OUTPUT = "Data/reddit_output.json"

def log_init():

    ''' Basic logger for HTTP requests initiated by PRAW '''

    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG)
    logger = logging.getLogger('prawcore')
    logger.setLevel(logging.DEBUG)
    logger.addHandler(handler)

def create_submission_object(submission):

	''' Create submission object for inclusion in twitter posts file'''
	
	submission_obj = {}
	submission_obj['title'] = submission.title
	submission_obj['url'] = submission.url
	submission_obj['link'] = "https://www.reddit.com"+ submission.permalink
	submission_obj['author'] = submission.author.name
	submission_obj['domain'] = submission.domain
	submission_obj['linkflair'] = submission.link_flair_text

	return submission_obj
		
def already_scraped(post_id, created):
	
	''' 
	Check to see if submission with 
	scrape_key = "submission.name , submission.permalink" 
	exists in file
	'''
	
	# To only check the post going back so far
	# Use date post made onto board and set the date back SEARCH_BACK_DAYS days
	post_date_check = created - (DAY_IN_SECS * SEARCH_BACK_DAYS)
	# Read line by line backwards to get most up-to-date posts first
	with FileReadBackwards(SCRAPED_POSTS_FILE, encoding="utf-8") as spf:
		for line in spf:
			line = line.replace('\n', '')
			# Lines are of form creation,id
			# Get each argument to check with our current post
			line_created,line_copy = line.split(",")
			# If we've found a match then stop
			## print line_copy + " == " + post_id + " -> " + str(line_copy == post_id)
			if line_copy == post_id:
				## print "Match found for " + post_id
				return 1
			# If we've gotten past SEARCH_BACK_DAYS days then stop
			## print str(line_created) + " < " + str(post_date_check) + " -> " + str(float(line_created) < post_date_check)
			if float(line_created) < post_date_check:
				## print "Looked past " + str(SEARCH_BACK_DAYS) + " days for " + post_id
				return 0
	# If there is no match then the current post hasn't been scraped.
	## print "No match found for " + post_id
	return 0

def is_special_post(title, linkflair, author):
	special_phrases = ["[Game Thread]", "[Post Game Thread]", "Off Topic Free Talk Thread", "4th and 5", "Pretend We're Football"]
	special_users = ["LonghornMod", "OnAComputer"]
	special_linkflairs = ["OFF TOPIC", "GDT", "PGT"]
	if any(phrase in title for phrase in special_phrases) or any(author in user for user in special_users) or (linkflair is not None and any(lf in linkflair for lf in special_linkflairs)):
		return 1
	return 0
	
def scrape(reddit):
	
	''' Scrape the hot posts on LonghornNation and create JSON of posts not yet scraped '''
	
	# Final array that will be written to twitter posts outfile
	new_hot_posts = []
	submissions = reddit.subreddit(SUBREDDIT).new(limit=subreddit_parse_limit)
	sub_list = []
	# put into list to reverse later
	for submission in submissions:
		sub_list.append(submission)
	# Iterate through the subreddit's top X posts
	# Reverse so newest posts are searched first
	for submission in reversed(sub_list):
		# Check to see if this submission has already been seen and scraped
		been_scraped = already_scraped(submission.id, submission.created_utc)
		## print submission.id + " has been scraped? " + str(bool(been_scraped))
		if not been_scraped:
			# If post hasn't been scraped see if it meets minimum score requirements or is special
			## print "Post is above 15? " + str(submission.score > MIN_SCORE) + " ||| Post is approved? "+ str(submission.approved) + " ||| And/Or post is special? " + str(is_special_post(submission.title, submission.link_flair_text, submission.author.name))
			if  (submission.score > MIN_SCORE and submission.approved) or is_special_post(submission.title, submission.link_flair_text, submission.author.name):
				# Get an object with data for Twitter
				# Append object to list to be exported to JSON
				# Add post to scraped posts file
				print "\rScraping post" + submission.id
				submission_obj = create_submission_object(submission)
				new_hot_posts.append(submission_obj)
				with open(SCRAPED_POSTS_FILE, "a") as spf:
					spf.write(str(submission.created_utc) + "," + submission.id +"\n")
	# Export to JSON file. This contains newly scraped posts.
	with open(REDDIT_OUTPUT, 'wb') as outfile:
		json.dump(new_hot_posts, outfile)

def run():
	
	''' Driver for program '''
	
	print "Starting scraper..."
	with open('credentials.json', 'r') as readfile:
		credentials = json.load(readfile).get('reddit')
	reddit = praw.Reddit(client_id=credentials.get('client_id'),
                         client_secret=credentials.get('client_secret'),
						 password=credentials.get('password'),
                         user_agent=credentials.get('user_agent'),
                         username=credentials.get('username'))
	scrape(reddit)
	print "Ending scraper..."
	
if __name__ == '__main__':
	print "Running scraper..."
	run()
