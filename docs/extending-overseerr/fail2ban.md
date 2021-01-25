# Protecting Your Server Using Fail2ban

{% hint style="warning" %}
If your OS runs `firewalld`, make sure it is running and that Overseerr is accessible before continuing.
{% endhint %}

### Configuring Fail2ban

After installing Fail2ban, the configuration files should be located at `/etc/fail2ban`. Make ***copies*** of `jail.conf` and `fail2ban.conf` in the same directoy, replacing the `.conf` extensions with `.local`.

Next, open `jail.local` in a text editor.  Add the following jail configuration under `JAILS`:

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

Parameter|Description
---|---
`logpath`|Path to the log file to be parsed by the filter.
`filter`|Name of the filter to be used to detect matches.
`maxretry`|Number of matches required be found within `findtime` seconds to trigger a ban action.
`findtime`|The time (in seconds) within which `maxretry` matches must be found to trigger a ban action.
`bantime`|Duration (in seconds) to ban matched IP adresses which have exceeded the `maxretry` limit. Set to a negative value for "permanent" bans.

By default, Fail2ban logs all its actions into `/var/log/fail2ban.log`. Although it's not recommended due to performance issues, you can change it to `systemd` (`journalctl`) by uncommenting the last line of the configuration.

Save the file and exit your text editor.

Now, create the file `/etc/fail2ban/filter.d/overseerr.conf` and add the following:

```
[Definition]
failregex = .*\[info\]\[Auth\]\: Failed login attempt.*"ip":"<HOST>"
```

Once again, save the file and exit your text editor.

Finally, enable automatic initialization and start Fail2ban by running the following command:

```bash
systemctl --now enable fail2ban.service
```

### Testing Fail2ban

Check if your configuration was loaded correctly by issuing the command `fail2ban-client -d`. You should see something similar to the following:

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
The login attempts in the next step should be initiated from a secondary device (e.g., a cellphone or tablet). Otherwise, you may lock yourself out of your server for the `bantime` defined in `jail.local`.
{% endhint %}

Now, while running the command `tail -f /var/log/fail2ban.log`, attempt to log in as a local user to Overseerr using an incorrect password `maxretry` times. You should see output similar to the following:

```
2021-01-24 21:22:34,085 fail2ban.filter         [756640]: INFO    [overseerr] Found 172.88.220.196 - 2021-01-24 21:22:34
2021-01-24 21:22:35,688 fail2ban.filter         [756640]: INFO    [overseerr] Found 172.88.220.196 - 2021-01-24 21:22:35
2021-01-24 21:22:36,622 fail2ban.filter         [756640]: INFO    [overseerr] Found 172.88.220.196 - 2021-01-24 21:22:36
2021-01-24 21:22:38,559 fail2ban.filter         [756640]: INFO    [overseerr] Found 172.88.220.196 - 2021-01-24 21:22:38
2021-01-24 21:22:41,264 fail2ban.filter         [756640]: INFO    [overseerr] Found 172.88.220.196 - 2021-01-24 21:22:41
2021-01-24 21:22:41,444 fail2ban.actions        [756640]: NOTICE  [overseerr] Ban 172.88.220.196
```
