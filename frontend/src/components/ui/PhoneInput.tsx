import { Smartphone } from 'lucide-react';

interface PhoneInputProps {
    countryCode: string;
    phoneNumber: string;
    onCountryCodeChange: (value: string) => void;
    onPhoneNumberChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
}

export default function PhoneInput({
    countryCode,
    phoneNumber,
    onCountryCodeChange,
    onPhoneNumberChange,
    disabled = false,
    required = true,
    placeholder = '9876543210'
}: PhoneInputProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                {/* Country Code Selection */}
                <div className="relative min-w-[80px]">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
                        <span className="text-[10px] font-bold">+</span>
                    </div>
                    <input
                        type="text"
                        className="w-full bg-surface/50 border border-white/10 rounded-xl p-3 pl-5 text-sm focus:outline-none focus:border-accent transition-all font-mono"
                        value={countryCode.replace('+', '')}
                        onChange={(e) => onCountryCodeChange(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="91"
                        maxLength={4}
                        disabled={disabled}
                        required={required}
                    />
                </div>

                {/* Number Input */}
                <div className="relative flex-1">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary opacity-50">
                        <Smartphone size={14} />
                    </div>
                    <input
                        type="text"
                        className="w-full bg-surface/50 border border-white/10 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:border-accent transition-all font-mono"
                        value={phoneNumber}
                        onChange={(e) => onPhoneNumberChange(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                    />
                </div>
            </div>
            <p className="text-[10px] text-secondary/60 ml-1">
                Enter country code and mobile number separately
            </p>
        </div>
    );
}
