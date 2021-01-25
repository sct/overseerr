# Protecting Your Server Using Fail2ban

{% hint style="warning" %}
If your OS runs `firewalld`, make sure it is running and Overseerr is accessible before continue.
{% endhint %}

### Setting up Fail2ban

After installing Fail2ban, the configuration files should be at `/etc/fail2ban`. Make a **copy** of `jail.conf` and `fail2ban.conf` to the same directoy, replacing the extension `.conf` with `.local`.

Edit `jail.local` and under JAILS, paste the configuration below:

```
[overseerr]
enabled         = true
port            = 5055
logpath         = /root/snap/overseerr/common/logs/overseerr.log
filter          = overseerr
maxretry        = 5
findtime        = 120
bantime         = 600
#action         = iptables-allports
action          = firewallcmd-allports
#backend        = systemd
```

**logpath:** Path to the log file which is provided to the filter.
**filter:** Name of the filter to be used by the jail to detect matches.
**maxretry:** Number of matches that triggers ban action on the IP.
**findtime:** The counter is set to zero if no match is found within "findtime" seconds.
**bantime:** Duration (in seconds) for IP to be banned for. Negative number for "permanent" ban.

By default, Fail2ban logs all its actions into `/var/log/fail2ban.log`. Although it's not recommended due to performance issues, you can change it to systemd (journalctl). For that, uncomment the last line of the configuration. Save the file and quit.

Create the file `/etc/fail2ban/filter.d/overseerr.conf`, add the lines below, save and quit:

```
[Definition]
failregex = .*\[info\]\[Auth\]\: Failed login attempt.*"ip":"<HOST>"
```

Enable automatic initialization and start Fail2ban:

`
systemctl --now enable fail2ban.service
`

### Testing Fail2ban

Check if your configuration was loaded correctly issuing the command `fail2ban-client -d`. You should see something similar to it:

```
['set', 'syslogsocket', 'auto']
['set', 'loglevel', 'INFO']
['set', 'logtarget', '/var/log/fail2ban.log']
['set', 'dbfile', '/var/lib/fail2ban/fail2ban.sqlite3']
['set', 'dbmaxmatches', 10]
['set', 'dbpurgeage', '1d']
['add', 'overseerr', 'auto']
['set', 'overseerr', 'usedns', 'warn']
['set', 'overseerr', 'addfailregex', '.*\\[info\\]\\[Auth\\]\\: Failed login attempt.*"ip":"<HOST>"']
['set', 'overseerr', 'maxretry', 5]
['set', 'overseerr', 'maxmatches', 5]
['set', 'overseerr', 'findtime', '120']
['set', 'overseerr', 'bantime', '600']
['set', 'overseerr', 'ignorecommand', '']
['set', 'overseerr', 'logencoding', 'auto']
['set', 'overseerr', 'addlogpath', '/root/snap/overseerr/common/logs/overseerr.log', 'head']
['set', 'overseerr', 'addaction', 'firewallcmd-allports']
['multi-set', 'overseerr', 'action', 'firewallcmd-allports', [['actionstart', 'firewall-cmd --direct --add-chain <family> filter f2b-overseerr\nfirewall-cmd --direct --add-rule <family> filter f2b-overseerr 1000 -j RETURN\nfirewall-cmd --direct --add-rule <family> filter INPUT_direct 0 -j f2b-overseerr'], ['actionstop', 'firewall-cmd --direct --remove-rule <family> filter INPUT_direct 0 -j f2b-overseerr\nfirewall-cmd --direct --remove-rules <family> filter f2b-overseerr\nfirewall-cmd --direct --remove-chain <family> filter f2b-overseerr'], ['actioncheck', "firewall-cmd --direct --get-chains <family> filter | sed -e 's, ,\\n,g' | grep -q '^f2b-overseerr$'"], ['actionban', 'firewall-cmd --direct --add-rule <family> filter f2b-overseerr 0 -s <ip> -j REJECT --reject-with <rejecttype>'], ['actionunban', 'firewall-cmd --direct --remove-rule <family> filter f2b-overseerr 0 -s <ip> -j REJECT --reject-with <rejecttype>'], ['name', 'overseerr'], ['actname', 'firewallcmd-allports'], ['port', '1:65535'], ['protocol', 'tcp'], ['family', 'ipv4'], ['chain', 'INPUT_direct'], ['zone', 'public'], ['service', 'ssh'], ['rejecttype', 'icmp-port-unreachable'], ['blocktype', 'REJECT --reject-with <rejecttype>'], ['rich-blocktype', "reject type='<rejecttype>'"], ['family?family=inet6', 'ipv6'], ['rejecttype?family=inet6', 'icmp6-port-unreachable']]]
['start', 'overseerr']
```

{% hint style="danger" %}
The login tries should be done from a different device (cellphone/tablet), otherwise, you will lock yourself out of the server for the X amount of time set up in your configuration files.
{% endhint %}

Now, running the command `tail -f /var/log/fail2ban.log`, access Overseerr and type a wrong password for a local user five times. I should see the messages below:

`
2021-01-24 21:22:34,085 fail2ban.filter         [756640]: INFO    [overseerr] Found 172.88.220.196 - 2021-01-24 21:22:34
2021-01-24 21:22:35,688 fail2ban.filter         [756640]: INFO    [overseerr] Found 172.88.220.196 - 2021-01-24 21:22:35
2021-01-24 21:22:36,622 fail2ban.filter         [756640]: INFO    [overseerr] Found 172.88.220.196 - 2021-01-24 21:22:36
2021-01-24 21:22:38,559 fail2ban.filter         [756640]: INFO    [overseerr] Found 172.88.220.196 - 2021-01-24 21:22:38
2021-01-24 21:22:41,264 fail2ban.filter         [756640]: INFO    [overseerr] Found 172.88.220.196 - 2021-01-24 21:22:41
2021-01-24 21:22:41,444 fail2ban.actions        [756640]: NOTICE  [overseerr] Ban 172.88.220.196
`
