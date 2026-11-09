<script setup>
</script>

<template>
  <footer class="bg-surface-light dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 pt-16 pb-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div>
          <img 
            alt="Yukflix Logo" 
            class="h-8 mb-6 object-contain" 
            src="/src/assets/logo.png"
          />
          <div class="flex space-x-4">
            <a class="text-gray-400 hover:text-primary" href="#">
              <span class="material-icons">facebook</span>
            </a>
            <a class="text-gray-400 hover:text-primary" href="#">
              <span class="material-icons">camera_alt</span>
            </a>
            <a class="text-gray-400 hover:text-primary" href="#">
              <span class="material-icons">alternate_email</span>
            </a>
            <a class="text-gray-400 hover:text-primary" href="#">
              <span class="material-icons">ondemand_video</span>
            </a>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Company</h4>
          <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li><a class="hover:text-primary" href="#">About Us</a></li>
            <li><a class="hover:text-primary" href="#">Careers</a></li>
            <li><a class="hover:text-primary" href="#">Press</a></li>
            <li><a class="hover:text-primary" href="#">Blog</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Support</h4>
          <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li><a class="hover:text-primary" href="#">Contact Us</a></li>
            <li><a class="hover:text-primary" href="#">Help Center</a></li>
            <li><a class="hover:text-primary" href="#">Redeem Voucher</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Legal</h4>
          <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li><a class="hover:text-primary" href="#">Terms of Use</a></li>
            <li><a class="hover:text-primary" href="#">Privacy Policy</a></li>
            <li><a class="hover:text-primary" href="#">Cookie Preferences</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-gray-200 dark:border-gray-800 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-500">
        <p>© 2026 Yukflix. All rights reserved.</p>
        <p>Made with design taste by Myber.</p>
      </div>
    </div>
  </footer>
</template>
