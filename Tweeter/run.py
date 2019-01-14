import sched, time
import tweeter
import datetime
s = sched.scheduler(time.time, time.sleep)
def run(sc):
	st = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
	print "Running program... " + str(st)
	tweeter.run()
	print "Program run. Sleeping for 5 mins..."
	s.enter(300, 1, run, (sc,))
s.enter(1, 1, run, (s,))
s.run()