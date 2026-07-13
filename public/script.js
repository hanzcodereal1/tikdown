document.querySelectorAll('.faq-box .faq-question').forEach(function(question) {
  question.addEventListener('click', function() {
    var content = this.nextElementSibling;
    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
      content.style.maxHeight = '0';
    } else {
      document.querySelectorAll('.faq-content').forEach(function(c) {
        c.style.maxHeight = '0';
      });
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  });
});

var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('aos-animate');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('[data-aos]').forEach(function(el) {
  observer.observe(el);
});

function downloadFile(url, filename) {
  var link = document.createElement('a');
  link.href = url;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

document.getElementById('downloadForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var url = document.getElementById('tiktokUrl').value.trim();
  var container = document.getElementById('resultContainer');

  if (!url) {
    container.innerHTML = '<div class="text-red-400"><i class="fas fa-exclamation-circle"></i> Please paste a TikTok link</div>';
    return;
  }

  container.innerHTML = '<div class="text-gray-400"><i class="fas fa-spinner fa-spin"></i> Processing...</div>';

  try {
    var response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url })
    });

    var data = await response.json();

    if (data.success && data.data) {
      var result = data.data;
      var html = '<div class="bg-[252525] rounded-xl p-6 border border-gray-700 shadow-xl">';
      
      html += '<div class="result-grid">';
      
      html += '<div class="result-left">';
      if (result.thumbnail) {
        html += '<img src="' + result.thumbnail + '" alt="Thumbnail" class="result-thumb" />';
      }
      
      if (result.type === 'photo' && result.slides && result.slides.length > 0) {
        html += '<div class="slider-container">';
        html += '<div class="slider-wrapper">';
        result.slides.forEach(function(slide) {
          html += '<div class="slider-slide"><img src="' + slide.url + '" alt="Slide ' + slide.index + '" /></div>';
        });
        html += '</div>';
        html += '<button class="slider-btn left" onclick="changeSlide(-1)"><i class="fas fa-chevron-left"></i></button>';
        html += '<button class="slider-btn right" onclick="changeSlide(1)"><i class="fas fa-chevron-right"></i></button>';
        html += '<div class="slide-indicator">1 / ' + result.slides.length + '</div>';
        html += '</div>';
      }
      
      if (result.username) {
        html += '<div class="uploader-info">';
        html += '<div class="uploader-avatar">' + result.username.charAt(0).toUpperCase() + '</div>';
        html += '<div class="uploader-name">';
        html += '<h4>@' + result.username + '</h4>';
        html += '<p>TikTok Creator</p>';
        html += '</div></div>';
      }
      html += '</div>';
      
      html += '<div class="result-right">';
      if (result.description) {
        html += '<div class="video-desc">' + result.description + '</div>';
      }
      
      html += '<div class="stats-grid">';
      if (result.stats) {
        if (result.stats.likes) html += '<div class="stat-item"><i class="fas fa-heart"></i> <span>' + formatNumber(result.stats.likes) + '</span></div>';
        if (result.stats.comments) html += '<div class="stat-item"><i class="fas fa-comment"></i> <span>' + formatNumber(result.stats.comments) + '</span></div>';
        if (result.stats.shares) html += '<div class="stat-item"><i class="fas fa-share"></i> <span>' + formatNumber(result.stats.shares) + '</span></div>';
        if (result.stats.views) html += '<div class="stat-item"><i class="fas fa-eye"></i> <span>' + formatNumber(result.stats.views) + '</span></div>';
      }
      html += '</div>';
      
      html += '<div class="download-actions">';
      
      if (result.type === 'photo') {
        if (result.slides && result.slides.length > 0) {
          html += '<button class="btn-download photo" onclick="downloadCurrentSlide()"><i class="fas fa-image"></i> Download Current Photo</button>';
          html += '<div class="photo-list">';
          result.slides.forEach(function(slide) {
            var filename = 'slide_' + slide.index + '.jpg';
            html += '<button onclick="downloadFile(\'' + slide.url + '\', \'' + filename + '\')" class="btn-download photo-small"><i class="fas fa-image"></i> Photo ' + slide.index + '</button>';
          });
          html += '</div>';
        }
      } else {
        if (result.downloads && result.downloads.nowm && result.downloads.nowm.length > 0) {
          result.downloads.nowm.forEach(function(link, index) {
            var filename = 'tiktok_no_watermark_' + (index + 1) + '.mp4';
            html += '<button onclick="downloadFile(\'' + link + '\', \'' + filename + '\')" class="btn-download premium-hd"><i class="fas fa-video"></i> Video Full HD</button>';
          });
        }
        if (result.downloads && result.downloads.wm && result.downloads.wm.length > 0) {
          result.downloads.wm.forEach(function(link, index) {
            var filename = 'tiktok_with_watermark_' + (index + 1) + '.mp4';
            html += '<button onclick="downloadFile(\'' + link + '\', \'' + filename + '\')" class="btn-download regular"><i class="fas fa-video"></i> Video Standar</button>';
          });
        }
        if (result.mp3 && result.mp3.length > 0) {
          result.mp3.forEach(function(link, index) {
            var filename = 'tiktok_audio_' + (index + 1) + '.mp3';
            html += '<button onclick="downloadFile(\'' + link + '\', \'' + filename + '\')" class="btn-download audio"><i class="fas fa-music"></i> Audio MP3</button>';
          });
        }
      }
      
      html += '</div></div></div></div>';
      
      html += '<script>';
      html += 'var slides = ' + JSON.stringify(result.slides || []) + ';';
      html += 'var currentSlide = 0;';
      html += 'function changeSlide(dir) {';
      html += '  currentSlide = Math.max(0, Math.min(slides.length - 1, currentSlide + dir));';
      html += '  var wrapper = document.querySelector(".slider-wrapper");';
      html += '  if (wrapper) wrapper.style.transform = "translateX(-" + currentSlide * 100 + "%)";';
      html += '  var indicator = document.querySelector(".slide-indicator");';
      html += '  if (indicator) indicator.textContent = (currentSlide + 1) + " / " + slides.length;';
      html += '}';
      html += 'function downloadCurrentSlide() {';
      html += '  if (slides && slides.length > 0) {';
      html += '    var filename = "slide_" + (currentSlide + 1) + ".jpg";';
      html += '    downloadFile(slides[currentSlide].url, filename);';
      html += '  }';
      html += '}';
      html += '<\/script>';
      
      container.innerHTML = html;
    } else {
      container.innerHTML = '<div class="text-red-400"><i class="fas fa-exclamation-circle"></i> ' + (data.error || 'Failed to get download links. Make sure the video is public.') + '</div>';
    }
  } catch (err) {
    container.innerHTML = '<div class="text-red-400"><i class="fas fa-exclamation-circle"></i> Error: ' + err.message + '</div>';
  }
});
