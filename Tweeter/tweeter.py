import json
from twython import Twython
import scraper

SPECIAL_DOMAINS = ["twitter.com", "imgur.com", "i.imgur.com", "youtube.com", "youtu.be", "soundcloud.com", "streamable.com"]
SPECIAL_PHRASES = ["[Game Thread]", "[Post Game Thread]", "Off Topic Free Talk Thread", "4th and 5", "Pretend We're Football"]


def setup_tweet_body(title, domain, official):
	body = (title[:207] + "...") if len(title) > 211 else title
	if official:
		if "Off Topic Free Talk Thread" in title:
			return title[12:] + " is up! Go check it out.\n" 
	return body + "\n"

def create_tweet(post):
	special_users = ["LonghornMod"]
	special_linkflairs = ["OFF TOPIC", "GDT", "PGT"]
	
	title = post['title']
	author = post['author']
	domain = post['domain']
	linkflair = post['linkflair']
	url = post['link']
	official = 0

	if any(phrase in title for phrase in SPECIAL_PHRASES) or any(author in user for user in special_users) or (linkflair is not None and any(lf in linkflair for lf in special_linkflairs)):
		official = 1
		
	body = setup_tweet_body(title, domain, official)
	
	if any(domain in d for d in SPECIAL_DOMAINS):
		url = post['url']
	
	return body + url

def run():
	print "Starting tweeter..."
	with open('credentials.json', 'r') as readfile:
		credentials = json.load(readfile).get('twitter')
	twitter = Twython(credentials['consumer_key'], credentials['consumer_secret'], credentials['access_token'], credentials['access_secret'])
	
	# Run Reddit Scrapper
	scraper.run()
	
	with open('Data/reddit_output.json', 'r') as reddit_output:
		reddit_posts = json.load(reddit_output)
	if not reddit_posts:
		print("\rNo new posts scraped for tweeting.")
		print "Ending tweeter..."
		return
	for post in reddit_posts:
		tweet = create_tweet(post)
		twitter.update_status(status=tweet)
		print "\r" + tweet
	print "Ending tweeter..."
	
if __name__ == '__main__':
	print "Running tweeter..."
	run()
