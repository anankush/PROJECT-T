# DCN Project — Local Web Server Setup

A complete guide to setting up, configuring, securing, and deploying a web server on a local network for a Data Communication Networks project.

---

## Table of Contents

- [System Administrator — Server Setup](#-system-administrator--server-setup)
- [Network Administrator — Network Configuration](#-network-administrator--network-configuration)
- [Web Developer — Website Deployment](#-web-developer--website-deployment)
- [Security Analyst — Firewall & Hardening](#-security-analyst--firewall--hardening)
- [DevOps / Monitor — Logging & Stress Testing](#-devops--monitor--logging--stress-testing)

---

## 🖥️ System Administrator — Server Setup

### Phase 1: Environment Setup

Get the machine ready — this can be a VirtualBox VM or a spare laptop on your local network.

1. **Install Ubuntu Server** — Use the server edition (not desktop). It enforces terminal usage, consumes fewer resources, and looks more professional for a CS project.

2. **Update the Package Repository** — Always sync the system before installing anything:

```bash
sudo apt update
sudo apt upgrade -y
```

---

### Phase 2: Installing the Web Server (Apache)

**Apache** (`apache2`) is the industry standard for a reliable basic web server setup.

1. **Install Apache:**

```bash
sudo apt install apache2 -y
```

2. **Start and Enable the Service** — Ensures Apache restarts automatically on reboot:

```bash
sudo systemctl start apache2
sudo systemctl enable apache2
```

3. **Verify it's Running:**

```bash
sudo systemctl status apache2
```

> 💡 **Tip:** Screenshot the output showing `active (running)` in green — great for documentation.

---

### Phase 3: Fixing Directory Permissions

By default, `/var/www/html` is owned by `root`. This must be changed so the web developer can upload files without requiring root access — which is a security risk.

1. **Change Ownership:**

```bash
sudo chown -R $USER:$USER /var/www/html
```

> The `-R` flag applies the change recursively to all files inside the folder.

2. **Set File Permissions:**

```bash
sudo chmod -R 755 /var/www/html
```

---

### Phase 4: Initial Testing

Before handing off, verify the server is actually serving pages.

1. **Find the Server's Local IP:**

```bash
ip addr show
```

Look for the `inet` address under your main network interface (e.g., `eth0` or `enp0s3`) — it will look like `192.168.x.x`.

2. **Test in Browser** — On your host machine, open a browser and enter the server's IP. You should see the **Apache2 Ubuntu Default Page**.

---

## 🌐 Network Administrator — Network Configuration

### Phase 1: Assigning a Static IP (Netplan)

Modern Ubuntu Server uses **Netplan** to manage network configuration via YAML files.

1. **Find the Network Interface Name:**

```bash
ip link
```

2. **Edit the Netplan Configuration:**

```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

3. **Update the File:**

> ⚠️ YAML is sensitive to spacing — always use **spaces**, never tabs.

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3: # Put your interface name here
      dhcp4: no
      addresses:
        - 192.168.1.150/24 # The static IP you want to give the server
      routes:
        - to: default
          via: 192.168.1.1 # Your local router's gateway IP
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1] # Google and Cloudflare DNS
```

4. **Apply the Changes:**

```bash
sudo netplan apply
```

> If you were connected via SSH and got disconnected, reconnect using the new static IP: `192.168.1.150`.

---

### Phase 2: Verifying Local Network Connectivity

Ensure that client machines on the same Wi-Fi or local network can reach the server.

**Ping the server from the client laptop:**

```bash
ping 192.168.1.150
```

If you receive replies, the network route is working correctly.

---

### Phase 3: Setting Up Local DNS

Instead of presenting raw IPs, map a friendly domain name to the server using **local DNS resolution** via the hosts file.

On the **client machine** (the laptop used for the presentation):

- **Windows:** Open Notepad as Administrator → `C:\Windows\System32\drivers\etc\hosts`
- **Linux/Mac:** Run `sudo nano /etc/hosts`

Add this line at the bottom:

```text
192.168.1.150    myproject.local
```

Save and exit.

---

### Phase 4: Handoff Test

Open any browser on the client machine and navigate to:

```
http://myproject.local
```

If the Apache default page loads using the custom domain, the network infrastructure is successfully configured.

---

## 💻 Web Developer — Website Deployment

### Phase 1: Local Development

On the local client machine, create the project directory and files:

```
project-website/
├── index.html
└── style.css
```

> 💡 **Pro-tip:** Include a section on the website listing all team members and their roles — it's a great touch during live demos.

---

### Phase 2: Secure Deployment via SCP

Use **SCP (Secure Copy Protocol)** over SSH to push files from the client to the server — the professional standard for file transfer in a networking environment.

1. **Navigate to the Project Folder:**

```bash
cd path/to/project-website
```

2. **Transfer Files to the Server:**

```bash
scp index.html style.css username@192.168.1.150:/var/www/html/
```

> Replace `username` with the actual Ubuntu server user account and `192.168.1.150` with the assigned static IP.

3. **Authenticate** — Enter the server user's password when prompted. A transfer progress bar will appear.

---

### Phase 3: Live Verification

Once the transfer completes:

1. Open a browser on the client machine.
2. Navigate to `http://myproject.local`.
3. If your custom HTML page loads instead of the Apache default page — deployment is successful ✅

---

## 🔒 Security Analyst — Firewall & Hardening

### Phase 1: Configuring UFW (Uncomplicated Firewall)

> ⚠️ **Important:** Configure all rules *before* enabling the firewall to avoid locking yourself out via SSH.

1. **Set Default Policies:**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

2. **Allow Required Services:**

```bash
sudo ufw allow ssh
sudo ufw allow http
```

> If HTTPS is added later, also run: `sudo ufw allow https`

3. **Enable the Firewall:**

```bash
sudo ufw enable
```

4. **Verify the Rules:**

```bash
sudo ufw status numbered
```

> 💡 Screenshot this output — it's excellent evidence for the final project report.

---

### Phase 2: Verifying the Attack Surface (Nmap Scan)

Run a network scan from the client laptop to prove the firewall is working:

```bash
nmap -sV -p- 192.168.1.150
```

> `-p-` scans all 65,535 ports. `-sV` identifies the service version on open ports.

**Expected Result:** Only **Port 22 (SSH)** and **Port 80 (HTTP)** should appear as open. Everything else should be filtered or closed — confirming the server is properly hardened.

---

## 📊 DevOps / Monitor — Logging & Stress Testing

### Phase 1: Server Log Auditing

SSH into the server and monitor live web traffic in real-time:

1. **SSH into the Server:**

```bash
ssh username@192.168.1.150
```

2. **Tail the Apache Access Log:**

```bash
sudo tail -f /var/log/apache2/access.log
```

> 💡 Have teammates refresh the website from their devices. You'll see the HTTP GET requests appear live in the terminal — screenshot this!

---

### Phase 2: Stress Testing (DCN Benchmark)

Demonstrate how the server handles network load using Apache Benchmark.

1. **Install Apache Utils on the Client (Linux):**

```bash
sudo apt install apache2-utils
```

2. **Run the Benchmark** — Send 1,000 requests, 100 at a time:

```bash
ab -n 1000 -c 100 http://192.168.1.150/
```

3. **Analyze the Output** — Key metrics to record for the final report:
   - **Requests per second**
   - **Time per request**

This data directly demonstrates network throughput — a core DCN concept.

---

### Phase 3: Final Technical Documentation

Compile all screenshots, command outputs, scan results, and benchmark statistics into the final architecture report. Include:

- Server configuration steps with screenshots
- Static IP and DNS setup
- UFW rules and Nmap scan results
- Apache access logs during live demo
- Benchmark output with throughput analysis

---

## 📁 Project Structure

```
PROJECT-T/
├── index.html        # Main webpage
├── style.css         # Stylesheet
└── script.js         # JavaScript file
```

---

## 🛠️ Tech Stack

| Component | Tool |
|---|---|
| OS | Ubuntu Server |
| Web Server | Apache2 |
| Network Config | Netplan |
| File Transfer | SCP / SSH |
| Firewall | UFW |
| Network Scanner | Nmap |
| Load Testing | Apache Benchmark (ab) |

---

> **Note:** This project is intended for a local network environment. All IPs and domain names (`myproject.local`) are local only and not publicly accessible.
