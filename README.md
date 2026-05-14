# ANY GPA | Global SaaS Engine 🌐🎓

![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![PHP](https://img.shields.io/badge/PHP-8.2-777BB4.svg?logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Cloud_Native-4479A1.svg?logo=mysql&logoColor=white)
![Wasmer](https://img.shields.io/badge/Deployed_on-Wasmer_Edge-black.svg?logo=webassembly&logoColor=white)
![GSAP](https://img.shields.io/badge/Physics-GSAP_3.12-88CE02.svg)

**ANY GPA** is a high-performance, globally crowdsourced academic calculation engine. Built for absolute flexibility, it allows students from any university worldwide to input, save, and share their specific grading frameworks and calculation strategies. 

This module serves as the academic calculation branch of the broader **Integrated Production and Resource Management System** portfolio.

---

## ✨ System Features

* **Progressive Web App (PWA) Architecture:** Fully responsive, touch-optimized mobile UI with a custom HUD dropdown menu and GPU-accelerated GSAP physics (automatically disabled on mobile to preserve battery).
* **Edge Routing & Computation:** Deployed on Wasmer Edge containers using WebAssembly (WASI) runners for ultra-low latency PHP execution.
* **Global Strategy Builder:** Users can design custom grading scales, deploy them to the global cloud database, or run them locally for temporary session memory.
* **Institutional Gateways:** Built-in programmatic checks for specific university frameworks (e.g., NIBM HNDSE26.1F criteria, Comm-2 module validation).
* **Native PDF Engine:** Client-side generation of highly accurate, printable, and mathematically verified official academic transcripts using `jsPDF` and `AutoTable`.
* **"God Mode" Administration:** Secure terminal for database management and live system purging.

---

## 🏗️ System Architecture

The system utilizes a stateless Edge computing model. The PHP backend connects via a persistent PDO buffer to a remote managed MySQL instance.

```mermaid
graph TD
    A[Global User / Mobile PWA] -->|HTTPS| B(Wasmer Edge Node)
    B --> C{PHP 8.2 Runner}
    C -->|API: get_systems| D[MySQL Cloud Database]
    D -->|Handshake Accepted| C
    C -->|JSON Response| A
    
    style B fill:#111,stroke:#FFD700,stroke-width:2px,color:#fff
    style D fill:#003300,stroke:#00e676,stroke-width:2px,color:#fff
