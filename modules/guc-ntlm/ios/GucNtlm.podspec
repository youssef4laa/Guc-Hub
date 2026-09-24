Pod::Spec.new do |s|
  s.name           = 'GucNtlm'
  s.version        = '0.1.0'
  s.summary        = 'NTLM transport for Guc Hub (ADR A-001)'
  s.description    = 'Answers NTLM challenges with the OS network stack for the GUC portal and Exchange EWS.'
  s.license        = 'UNLICENSED'
  s.author         = 'Guc Hub'
  s.homepage       = 'https://github.com/youssef4laa/Guc-Hub'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/youssef4laa/Guc-Hub.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
