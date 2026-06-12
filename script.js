document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const filterButtons = document.querySelectorAll('.filter-btn');
    const destinationCards = document.querySelectorAll('.destination-card');
    const quickSearchInput = document.getElementById('quickSearchInput');
    const quickSearchBtn = document.getElementById('quickSearchBtn');
    const quickSearchDate = document.getElementById('quickSearchDate');
    const quickSearchGuests = document.getElementById('quickSearchGuests');
    const destinationsGrid = document.getElementById('destinationsGrid');
    
    const bookingForm = document.getElementById('bookingForm');
    const destinationSelect = document.getElementById('destination');
    const fullNameInput = document.getElementById('fullName');
    
    const loaderOverlay = document.getElementById('loaderOverlay');
    const loaderMessage = document.getElementById('loaderMessage');
    const successToast = document.getElementById('successToast');
    const toastDetails = document.getElementById('toastDetails');

    // Create a container for dynamic search feedback messages
    let feedbackMsg = document.createElement('div');
    feedbackMsg.className = 'search-feedback';
    feedbackMsg.style.gridColumn = '1 / -1';
    feedbackMsg.style.textAlign = 'center';
    feedbackMsg.style.padding = '2rem';
    feedbackMsg.style.fontSize = '1.1rem';
    feedbackMsg.style.color = 'var(--text-secondary)';
    feedbackMsg.style.display = 'none';
    destinationsGrid.appendChild(feedbackMsg);

    // Set today's date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    if (quickSearchDate) quickSearchDate.value = today;
    const travelDateInput = document.getElementById('travelDate');
    if (travelDateInput) travelDateInput.value = today;

    /* ==========================================
       1. Helper: Bind Booking Triggers Dynamically
       ========================================== */
    function bindBookButton(button) {
        button.addEventListener('click', (e) => {
            const destinationName = e.target.getAttribute('data-dest');
            
            // Check if destination exists in the dropdown, if not add it dynamically
            let optionExists = false;
            for (let i = 0; i < destinationSelect.options.length; i++) {
                if (destinationSelect.options[i].value === destinationName) {
                    optionExists = true;
                    break;
                }
            }

            if (!optionExists) {
                // Add new dynamic option
                const newOpt = document.createElement('option');
                newOpt.value = destinationName;
                newOpt.textContent = destinationName;
                
                // Add under dynamic optgroup or directly to select
                let dynamicGroup = destinationSelect.querySelector('optgroup[label="Global Destinations"]');
                if (!dynamicGroup) {
                    dynamicGroup = document.createElement('optgroup');
                    dynamicGroup.label = "Global Destinations";
                    destinationSelect.appendChild(dynamicGroup);
                }
                dynamicGroup.appendChild(newOpt);
            }
            
            // Set select value
            if (destinationSelect) {
                destinationSelect.value = destinationName;
            }
            
            // Sync details if quick search guest count was changed
            const guestsInput = document.getElementById('guests');
            if (guestsInput && quickSearchGuests) {
                guestsInput.value = quickSearchGuests.value;
            }
            const dateInput = document.getElementById('travelDate');
            if (dateInput && quickSearchDate) {
                dateInput.value = quickSearchDate.value;
            }

            // Scroll smoothly to form and focus name
            document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                if (fullNameInput) fullNameInput.focus();
            }, 800);
        });
    }

    // Bind initial static buttons
    document.querySelectorAll('.book-trigger').forEach(bindBookButton);

    /* ==========================================
       2. Destination Filtering (Static Cards)
       ========================================== */
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and add to current
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const category = button.getAttribute('data-category');

            // Hide dynamic search result cards when switching tabs
            document.querySelectorAll('.dynamic-card').forEach(c => c.remove());
            feedbackMsg.style.display = 'none';

            destinationCards.forEach(card => {
                // Smooth CSS transition effect
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    if (category === 'all' || card.getAttribute('data-category') === category) {
                        card.style.display = 'flex';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        card.style.display = 'none';
                    }
                }, 300);
            });
        });
    });

    /* ==========================================
       3. Global Search (Local + Wikipedia API Fallback)
       ========================================== */
    async function performSearch() {
        const query = quickSearchInput.value.toLowerCase().trim();
        
        // Remove any previously fetched dynamic cards
        document.querySelectorAll('.dynamic-card').forEach(c => c.remove());
        feedbackMsg.style.display = 'none';

        if (query === '') {
            // Reset to show all cards
            destinationCards.forEach(card => {
                card.style.display = 'flex';
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            });
            return;
        }

        let localMatchCount = 0;
        destinationCards.forEach(card => {
            const name = card.getAttribute('data-name').toLowerCase();
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            const category = card.getAttribute('data-category').toLowerCase();

            if (name.includes(query) || title.includes(query) || description.includes(query) || category.includes(query)) {
                card.style.display = 'flex';
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
                localMatchCount++;
            } else {
                card.style.display = 'none';
                card.style.opacity = '0';
            }
        });

        // If no local match, search using Wikipedia API!
        if (localMatchCount === 0) {
            feedbackMsg.textContent = `Searching global servers for "${quickSearchInput.value}"...`;
            feedbackMsg.style.display = 'block';

            try {
                // Capitalize query words for Wikipedia
                const wikiQuery = quickSearchInput.value.split(' ')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                    .join('_');

                const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiQuery)}`);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.type === 'standard') {
                        feedbackMsg.style.display = 'none';

                        // Extract data
                        const title = data.title;
                        const extract = data.extract || "Explore this beautiful travel destination with Travelstar.";
                        const imageUrl = (data.originalimage && data.originalimage.source) || 
                                         (data.thumbnail && data.thumbnail.source) || 
                                         "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80"; // Fallback travel image
                        
                        // Check if it is in India
                        const isIndia = extract.toLowerCase().includes('india') || 
                                        title.toLowerCase().includes('india') || 
                                        extract.toLowerCase().includes('state of india');
                        const category = isIndia ? 'india' : 'international';
                        const badgeText = isIndia ? 'India' : 'International';
                        const badgeClass = isIndia ? 'badge-domestic' : 'badge-intl';
                        const priceSymbol = isIndia ? '₹' : '$';
                        const priceVal = isIndia ? (Math.floor(Math.random() * 10000) + 5000).toLocaleString('en-IN') : (Math.floor(Math.random() * 1500) + 400);
                        const durationDays = Math.floor(Math.random() * 5) + 3;

                        // Create dynamic card element
                        const newCard = document.createElement('div');
                        newCard.className = 'destination-card dynamic-card';
                        newCard.setAttribute('data-category', category);
                        newCard.setAttribute('data-name', title.toLowerCase());
                        newCard.style.opacity = '0';
                        newCard.style.transform = 'scale(0.95)';

                        newCard.innerHTML = `
                            <div class="card-img-wrapper">
                                <img src="${imageUrl}" alt="${title}">
                                <span class="badge ${badgeClass}">${badgeText}</span>
                            </div>
                            <div class="card-content">
                                <div class="card-meta">
                                    <span class="rating"><i class="fa-solid fa-star"></i> ${(Math.random() * 0.5 + 4.5).toFixed(1)}</span>
                                    <span class="duration"><i class="fa-regular fa-clock"></i> ${durationDays} Days</span>
                                </div>
                                <h3>${title}</h3>
                                <p>${extract.substring(0, 150)}...</p>
                                <div class="card-footer">
                                    <div class="price">
                                        <span class="price-label">From</span>
                                        <span class="price-val">${priceSymbol}${priceVal}</span>
                                    </div>
                                    <button class="btn btn-sm btn-primary book-trigger" data-dest="${title}">Book Now</button>
                                </div>
                            </div>
                        `;

                        // Append and animate card
                        destinationsGrid.appendChild(newCard);
                        
                        // Bind dynamic trigger button
                        const triggerBtn = newCard.querySelector('.book-trigger');
                        bindBookButton(triggerBtn);

                        setTimeout(() => {
                            newCard.style.display = 'flex';
                            setTimeout(() => {
                                newCard.style.opacity = '1';
                                newCard.style.transform = 'scale(1)';
                            }, 50);
                        }, 100);

                    } else {
                        feedbackMsg.textContent = `Could not find any global destinations matching "${quickSearchInput.value}". Try another spelling!`;
                    }
                } else {
                    feedbackMsg.textContent = `No results found for "${quickSearchInput.value}" in local database or global directory.`;
                }
            } catch (error) {
                console.error("Wikipedia fetch failed:", error);
                feedbackMsg.textContent = "Network Server error while fetching global destinations. Please try again.";
            }
        }

        // Scroll to grid if not already in view
        document.getElementById('destinations').scrollIntoView({ behavior: 'smooth' });
    }

    if (quickSearchBtn) {
        quickSearchBtn.addEventListener('click', performSearch);
    }
    if (quickSearchInput) {
        quickSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    /* ==========================================
       4. Booking Form Network Simulation & Toast
       ========================================== */
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const dest = document.getElementById('destination').value;
            const date = document.getElementById('travelDate').value;
            const guests = document.getElementById('guests').value;

            // Show simulated loading states with specific network steps
            loaderOverlay.classList.add('active');
            
            const networkSteps = [
                { time: 0, msg: "Initiating TCP 3-Way Handshake with server..." },
                { time: 800, msg: "Establishing secure TLS/SSL Session (HTTPS Port 443)..." },
                { time: 1600, msg: "Sending HTTP POST Request (Payload: JSON Booking Data)..." },
                { time: 2400, msg: "Waiting for host server response (InfinityFree Gateway)..." },
                { time: 3200, msg: "HTTP/1.1 201 Created received. Finalizing packets..." }
            ];

            networkSteps.forEach(step => {
                setTimeout(() => {
                    loaderMessage.textContent = step.msg;
                }, step.time);
            });

            // Complete connection simulation after 4 seconds
            setTimeout(() => {
                // Hide Loader
                loaderOverlay.classList.remove('active');

                // Get Client IP representation
                const randomOctet = () => Math.floor(Math.random() * 254) + 1;
                const mockClientIP = `192.168.1.${randomOctet()}`;
                const mockServerIP = `185.27.134.116`; // InfinityFree common server IP

                // Populate and show toast with network packet diagnostics
                toastDetails.innerHTML = `
                    <strong>Destination:</strong> ${dest}<br>
                    <strong>Travel Date:</strong> ${date} | <strong>Guests:</strong> ${guests}<br>
                    <strong>Source IP (Client):</strong> ${mockClientIP}:51022<br>
                    <strong>Dest IP (Server):</strong> ${mockServerIP}:443<br>
                    <strong>TCP Handshake:</strong> SYN-ACK Established<br>
                    <strong>Payload Size:</strong> ${JSON.stringify({name, email, dest, date, guests}).length} bytes
                `;

                successToast.classList.add('show');

                // Clear Form
                bookingForm.reset();
                if (travelDateInput) travelDateInput.value = today;

                // Hide Toast after 8 seconds
                setTimeout(() => {
                    successToast.classList.remove('show');
                }, 8000);

            }, 4000);
        });
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            
            // Toggle icon
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });

        // Close menu when clicking links
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.querySelector('i').className = 'fa-solid fa-bars';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileMenuBtn.querySelector('i').className = 'fa-solid fa-bars';
            }
        });
    }

    // Header scroll class toggle
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.main-header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
});
