import SwiftUI

struct GlassCard<Content: View>: View {
    var content: Content
    var cornerRadius: CGFloat = 24
    var padding: CGFloat = 16
    
    init(cornerRadius: CGFloat = 24, padding: CGFloat = 16, @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(.ultraThinMaterial)
                .background(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(Color.white.opacity(0.05))
                )
                .shadow(color: Color.white.opacity(0.2), radius: 2, x: -2, y: -2)
                .shadow(color: Color.black.opacity(0.2), radius: 4, x: 2, y: 2)
            
            content
                .padding(padding)
        }
        .padding(.horizontal, 8)
    }
}

struct QuantumGlassCard<Content: View>: View {
    var content: Content
    var cornerRadius: CGFloat = 24
    var padding: CGFloat = 16
    var glowColor: Color = Color.blue
    
    init(cornerRadius: CGFloat = 24, padding: CGFloat = 16, glowColor: Color = Color.blue, @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.padding = padding
        self.glowColor = glowColor
        self.content = content()
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(.ultraThinMaterial)
                .background(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(Color.white.opacity(0.05))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .stroke(
                            LinearGradient(
                                colors: [glowColor.opacity(0.3), glowColor.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
                .shadow(color: glowColor.opacity(0.3), radius: 8, x: 0, y: 0)
                .shadow(color: Color.white.opacity(0.2), radius: 2, x: -2, y: -2)
                .shadow(color: Color.black.opacity(0.2), radius: 4, x: 2, y: 2)
            
            content
                .padding(padding)
        }
        .padding(.horizontal, 8)
    }
}

struct AnimatedGlassCard<Content: View>: View {
    var content: Content
    var cornerRadius: CGFloat = 24
    var padding: CGFloat = 16
    var animationDuration: Double = 0.3
    
    @State private var isHovered = false
    
    init(cornerRadius: CGFloat = 24, padding: CGFloat = 16, animationDuration: Double = 0.3, @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.padding = padding
        self.animationDuration = animationDuration
        self.content = content()
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(.ultraThinMaterial)
                .background(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(Color.white.opacity(isHovered ? 0.1 : 0.05))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(isHovered ? 0.4 : 0.2),
                                    Color.white.opacity(isHovered ? 0.2 : 0.1)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: isHovered ? 2 : 1
                        )
                )
                .shadow(
                    color: Color.white.opacity(isHovered ? 0.3 : 0.2),
                    radius: isHovered ? 4 : 2,
                    x: -2,
                    y: -2
                )
                .shadow(
                    color: Color.black.opacity(isHovered ? 0.3 : 0.2),
                    radius: isHovered ? 6 : 4,
                    x: 2,
                    y: 2
                )
                .scaleEffect(isHovered ? 1.02 : 1.0)
            
            content
                .padding(padding)
        }
        .padding(.horizontal, 8)
        .onHover { hovering in
            withAnimation(.spring(response: animationDuration, dampingFraction: 0.8)) {
                isHovered = hovering
            }
        }
    }
}

struct GlassButton: View {
    var title: String
    var action: () -> Void
    var isEnabled: Bool = true
    var style: ButtonStyle = .primary
    
    enum ButtonStyle {
        case primary
        case secondary
        case danger
    }
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 16, weight: .semibold, design: .rounded))
                .foregroundColor(foregroundColor)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(backgroundColor)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .stroke(borderColor, lineWidth: 1)
                        )
                )
        }
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1.0 : 0.6)
        .scaleEffect(isEnabled ? 1.0 : 0.95)
    }
    
    private var backgroundColor: Color {
        switch style {
        case .primary:
            return Color.blue.opacity(0.2)
        case .secondary:
            return Color.gray.opacity(0.1)
        case .danger:
            return Color.red.opacity(0.2)
        }
    }
    
    private var borderColor: Color {
        switch style {
        case .primary:
            return Color.blue.opacity(0.4)
        case .secondary:
            return Color.gray.opacity(0.3)
        case .danger:
            return Color.red.opacity(0.4)
        }
    }
    
    private var foregroundColor: Color {
        switch style {
        case .primary:
            return Color.blue
        case .secondary:
            return Color.gray
        case .danger:
            return Color.red
        }
    }
}

struct GlassTextField: View {
    var title: String
    @Binding var text: String
    var placeholder: String = ""
    var isSecure: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundColor(.secondary)
            
            Group {
                if isSecure {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                }
            }
            .font(.system(size: 16, weight: .regular, design: .rounded))
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(Color.white.opacity(0.2), lineWidth: 1)
                    )
            )
        }
    }
}

struct GlassToggle: View {
    var title: String
    @Binding var isOn: Bool
    
    var body: some View {
        HStack {
            Text(title)
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .foregroundColor(.primary)
            
            Spacer()
            
            Toggle("", isOn: $isOn)
                .toggleStyle(GlassToggleStyle())
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                )
        )
    }
}

struct GlassToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button(action: {
            configuration.isOn.toggle()
        }) {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(configuration.isOn ? Color.blue : Color.gray.opacity(0.3))
                .frame(width: 50, height: 30)
                .overlay(
                    Circle()
                        .fill(Color.white)
                        .frame(width: 26, height: 26)
                        .offset(x: configuration.isOn ? 10 : -10)
                        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: configuration.isOn)
                )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    VStack(spacing: 20) {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("Balance")
                    .font(.headline)
                    .foregroundColor(.secondary)
                Text("$63,773.90")
                    .font(.largeTitle.bold())
                    .foregroundColor(.primary)
            }
        }
        
        QuantumGlassCard(glowColor: .blue) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Quantum Security")
                    .font(.headline)
                    .foregroundColor(.secondary)
                Text("Active")
                    .font(.title2.bold())
                    .foregroundColor(.blue)
            }
        }
        
        AnimatedGlassCard {
            VStack(spacing: 16) {
                GlassTextField(title: "Amount", text: .constant(""), placeholder: "Enter amount")
                GlassButton(title: "Transfer", action: {})
            }
        }
    }
    .padding()
    .background(
        LinearGradient(
            colors: [.blue.opacity(0.1), .black.opacity(0.9)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    )
}
